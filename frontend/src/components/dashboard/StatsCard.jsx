import { cn } from '../../utils/helpers'

export default function StatsCard({ title, value, icon: Icon, description, className, trend }) {
  return (
    <div className={cn('card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{value}</p>
          {description && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
          )}
          {trend && (
            <div className={cn('mt-2 text-sm font-medium', trend.positive ? 'text-teal-500' : 'text-red-500')}>
              {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg">
            <Icon className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
        )}
      </div>
    </div>
  )
}
