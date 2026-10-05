'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center mb-4 min-h-[40px]',
        caption_label: 'text-sm font-medium text-[#F5F0E8] hidden',
        nav: 'flex items-center justify-between absolute inset-x-2 top-2 z-20 pointer-events-none',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] border-[#D4AF37]/20 pointer-events-auto transition-all'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] border-[#D4AF37]/20 pointer-events-auto transition-all'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-10 w-10 text-center text-sm p-0 relative flex items-center justify-center',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] transition-colors rounded-md'
        ),
        selected: 'bg-[#D4AF37] text-[#0a0806] hover:bg-[#D4AF37] hover:text-[#0a0806] focus:bg-[#D4AF37] focus:text-[#0a0806] rounded-md shadow-lg shadow-[#D4AF37]/20',
        today: 'bg-[#D4AF37]/10 text-[#D4AF37] font-bold',
        outside: 'text-muted-foreground/30 opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        dropdowns: 'flex items-center gap-2 mx-auto',
        dropdown: 'bg-[#13100c] text-[#F5F0E8] border border-[#d4af37]/30 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] cursor-pointer hover:bg-[#1a1611] transition-colors',
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
