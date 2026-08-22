import React from 'react';
import { Ticket, Globe2, Users } from 'lucide-react';

export default function Stats() {
  const stats = [
    {
      icon: Ticket,
      number: '1M+',
      label: 'Tickets booked',
    },
    {
      icon: Globe2,
      number: '50+',
      label: 'Indian cities',
    },
    {
      icon: Users,
      number: '1000+',
      label: 'Live experiences',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.label}
            className="liquid-glass rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-xl hover:bg-white/5 transition-all"
          >
            <div className="text-white/60 mb-2">
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              {item.number}
            </div>
            <div className="text-xs text-white/60 font-normal mt-1">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
