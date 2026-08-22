import asyncio
import logging
from backend.app.core.config import settings
from backend.app.core.database import AsyncSessionLocal
from backend.app.services.seat_service import SeatService
from backend.app.services.waitlist_service import WaitlistService

logger = logging.getLogger("expiry_worker")
logging.basicConfig(level=logging.INFO)


async def run_expiry_cleanup_loop():
    """
    Background worker loop that periodically inspects and auto-releases:
    1. Expired seat holds (holds older than TTL with no checkout completed).
    2. Expired waitlist offers (unclaimed offers, reallocating seats to next in FIFO line).
    """
    logger.info("Starting background expiry cleanup worker loop...")
    while True:
        try:
            async with AsyncSessionLocal() as session:
                try:
                    cleaned_holds = await SeatService.cleanup_expired_holds(session)
                    cleaned_offers = await WaitlistService.cleanup_expired_offers(session)
                    if cleaned_holds or cleaned_offers:
                        logger.info(
                            f"[Worker Tick] Cleaned expired holds for shows: {cleaned_holds}, "
                            f"cleaned expired waitlist offers for shows: {cleaned_offers}"
                        )
                except Exception as e:
                    await session.rollback()
                    logger.error(f"[Worker Error] Error during expiry cleanup: {str(e)}")
        except Exception as e:
            logger.error(f"[Worker Error] Session initialization failure: {str(e)}")

        await asyncio.sleep(settings.EXPIRY_CLEANUP_INTERVAL_SECONDS)
