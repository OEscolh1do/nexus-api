import * as React from "react"

// BUTTON
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", ...props }, ref) => {
  const base = "px-4 py-2 rounded-md transition-colors font-medium text-sm focus-visible:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80"
  };
  const vClass = variants[variant as keyof typeof variants] || variants.default;
  return <button className={`${base} ${vClass} ${className}`} ref={ref} {...props} />
})

// INPUT
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} className={`border border-slate-300 dark:border-slate-700 bg-transparent dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none ${className}`} ref={ref} {...props} />
})

// CARD
type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, children, ...props }: CardProps) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-50 shadow-sm rounded-xl ${className}`} {...props}>{children}</div>
)
export const CardHeader = ({ className, children, ...props }: CardProps) => <div className={`p-6 ${className}`} {...props}>{children}</div>
export const CardTitle = ({ className, children, ...props }: CardProps) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
export const CardContent = ({ className, children, ...props }: CardProps) => <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>

// BADGE
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'outline' }
export const Badge = ({ variant = "default", className, children, ...props }: BadgeProps) => {
  const bg = variant === "outline" ? "border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-300" : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200";
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${bg} ${className}`} {...props}>{children}</div>
}

// TABS
export const Tabs = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />
export const TabsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 ${className}`} {...props} />
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { value: string }
export const TabsTrigger = ({ className, value, ...props }: TabsTriggerProps) => <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50 data-[state=active]:shadow-sm dark:data-[state=active]:shadow-slate-900/50 ${className}`} data-value={value} {...props} />
export const TabsContent = ({ className, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => <div data-value={value} className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`} {...props} />
