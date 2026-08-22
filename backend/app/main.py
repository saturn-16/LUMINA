import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.database import async_engine, Base, get_db
from backend.app.workers.expiry_worker import run_expiry_cleanup_loop
import backend.app.models  # ensure all models are registered

# Import API routers
from backend.app.api.auth import router as auth_router
from backend.app.api.events import router as events_router
from backend.app.api.shows import router as shows_router
from backend.app.api.holds import router as holds_router
from backend.app.api.bookings import router as bookings_router
from backend.app.api.waitlist import router as waitlist_router
from backend.app.api.organiser import router as organiser_router
from backend.app.api.admin import router as admin_router
from backend.app.api.websocket import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize database tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Auto-seed event catalogue if empty
    try:
        from backend.seed_data import seed_if_empty
        await seed_if_empty()
    except Exception as e:
        print(f"Auto-seeding check failed: {e}")

    # 3. Launch background expiry cleanup worker
    worker_task = asyncio.create_task(run_expiry_cleanup_loop())

    yield

    # 3. Shutdown: Cancel worker
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-quality ticket booking system for movies and concerts with concurrency protection, temporary seat holds with TTL, and waitlist auto-assignment.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.cors_origins_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(shows_router, prefix="/api")
app.include_router(holds_router, prefix="/api")
app.include_router(bookings_router, prefix="/api")
app.include_router(waitlist_router, prefix="/api")
app.include_router(organiser_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(ws_router)


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}


@app.get("/api/venues", tags=["Venues"])
async def list_venues_all(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from backend.app.models.venue import Venue
    stmt = select(Venue).options(selectinload(Venue.categories)).order_by(Venue.name.asc())
    result = await db.execute(stmt)
    venues = result.scalars().all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "address": v.address,
            "city": v.city,
            "total_rows": v.total_rows,
            "total_cols": v.total_cols,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "categories": [
                {
                    "id": c.id,
                    "venue_id": c.venue_id,
                    "name": c.name,
                    "color_code": c.color_code,
                    "tier_level": c.tier_level,
                }
                for c in (v.categories or [])
            ],
        }
        for v in venues
    ]


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/api/health",
    }
