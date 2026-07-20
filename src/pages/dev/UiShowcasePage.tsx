import { useState, type ReactNode } from 'react'
import { Bell, Heart, Search, Trash2, Plus, MoreVertical, Star, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Rating } from '@/components/ui/rating'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { TextField } from '@/components/forms/TextField'
import { Spinner } from '@/components/feedback/Spinner'
import {
  SkeletonText,
  SkeletonList,
  SkeletonCard,
  SkeletonDashboard,
  SkeletonTable,
} from '@/components/feedback/skeletons'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { Reveal } from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { toast } from '@/utils/toast'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-subtitle font-semibold text-foreground">{title}</h2>
      <div className="rounded-card border border-border bg-surface p-5">{children}</div>
    </section>
  )
}

/** Dev-only gallery of every design-system component + state (Milestone 2). */
export function UiShowcasePage() {
  const [confirm, setConfirm] = useState(false)
  const [radio, setRadio] = useState('percentage')

  return (
    <div className="app-container space-y-8 py-8">
      <header>
        <h1 className="text-title font-bold text-foreground">Design System</h1>
        <p className="text-body text-text-secondary">Milestone 2 component library (dev only).</p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="hero">Hero</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon={<Plus className="size-5" />}>With icon</Button>
        </div>
        <div className="mt-4">
          <Button fullWidth>Full width</Button>
        </div>
      </Section>

      <Section title="Icon buttons">
        <div className="flex items-center gap-3">
          <IconButton aria-label="Ghost" variant="ghost">
            <Bell />
          </IconButton>
          <IconButton aria-label="Subtle" variant="subtle">
            <Heart />
          </IconButton>
          <IconButton aria-label="Solid" variant="solid">
            <Plus />
          </IconButton>
          <IconButton aria-label="Outline" variant="outline">
            <MoreVertical />
          </IconButton>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">Primary</Badge>
          <Badge tone="secondary">Secondary</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="premium">
            <Star className="size-3" /> Premium
          </Badge>
          <Badge tone="neutral">Neutral</Badge>
        </div>
      </Section>

      <Section title="Avatar & Rating">
        <div className="flex items-center gap-4">
          <Avatar name="Ravi Kumar" size="sm" />
          <Avatar name="Ravi Kumar" size="md" />
          <Avatar name="Ravi Kumar" size="lg" />
          <Avatar name="Ravi Kumar" size="hero" />
        </div>
        <div className="mt-4 flex items-center gap-6">
          <Rating value={4.6} count={214} />
          <Rating value={3.2} size="md" />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card elevation="flat">
            <CardHeader>
              <CardTitle>Flat</CardTitle>
              <CardDescription>No shadow</CardDescription>
            </CardHeader>
          </Card>
          <Card elevation="soft">
            <CardHeader>
              <CardTitle>Soft</CardTitle>
              <CardDescription>Default</CardDescription>
            </CardHeader>
          </Card>
          <Card elevation="floating" interactive>
            <CardHeader>
              <CardTitle>Floating</CardTitle>
              <CardDescription>Hover me</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Business name" placeholder="e.g. Chai Nagri" />
          <TextField label="Search" leftIcon={<Search className="size-5" />} placeholder="Search…" />
          <TextField label="With error" error="This field is required" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="Tell customers about your business…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafe">Café</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="salon">Salon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="terms" defaultChecked />
              <Label htmlFor="terms">Accept terms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="push" />
              <Label htmlFor="push">Push notifications</Label>
            </div>
            <RadioGroup value={radio} onValueChange={setRadio} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percentage" id="r1" />
                <Label htmlFor="r1">Percentage</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="flat" id="r2" />
                <Label htmlFor="r2">Flat</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Section>

      <Section title="Tabs, Accordion">
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This week</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="pt-3 text-body text-text-secondary">
            Today's activity.
          </TabsContent>
          <TabsContent value="week" className="pt-3 text-body text-text-secondary">
            This week's activity.
          </TabsContent>
          <TabsContent value="month" className="pt-3 text-body text-text-secondary">
            This month's activity.
          </TabsContent>
        </Tabs>
        <Separator className="my-5" />
        <Accordion type="single" collapsible>
          <AccordionItem value="a1">
            <AccordionTrigger>How does the spinner work?</AccordionTrigger>
            <AccordionContent>Sign in, spin once a day, win a reward.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="a2">
            <AccordionTrigger>Is it free?</AccordionTrigger>
            <AccordionContent>Yes, customers never pay to spin.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover for tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Helpful hint</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent>Popover content lives here.</PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Button variant="danger" onClick={() => setConfirm(true)} leftIcon={<Trash2 className="size-5" />}>
            Delete (confirm)
          </Button>
        </div>
        <ConfirmationDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Delete this offer?"
          description="This can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            setConfirm(false)
            toast.success('Offer deleted')
          }}
        />
      </Section>

      <Section title="Breadcrumb, Progress, Spinner">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Offers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-4 max-w-sm space-y-3">
          <Progress value={65} />
          <Spinner />
        </div>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-3">
          <Button variant="success" onClick={() => toast.success('Reward added to your wallet!')}>
            Success
          </Button>
          <Button variant="danger" onClick={() => toast.error("We couldn't complete that.")}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info('A nearby shop has a new offer.')}>
            Info
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Your reward expires tomorrow.')}>
            Warning
          </Button>
          <Button variant="ghost" onClick={() => toast.undo('Offer deleted.', () => toast.success('Restored'))}>
            Undo
          </Button>
        </div>
      </Section>

      <Section title="Loading / Skeletons">
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonText lines={3} />
          <SkeletonList rows={3} />
          <SkeletonCard />
          <SkeletonTable rows={3} cols={3} />
        </div>
        <div className="mt-6">
          <SkeletonDashboard />
        </div>
      </Section>

      <Section title="Empty & Error states">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState
            icon={<Wallet className="size-7" />}
            title="No rewards yet"
            description="Visit a nearby shop and spin to win your first reward."
            actionLabel="Explore nearby"
            onAction={() => toast.info('Navigate to nearby')}
          />
          <ErrorState variant="offline" onRetry={() => toast.info('Retrying…')} />
        </div>
      </Section>

      <Section title="Motion">
        <Reveal>
          <p className="text-body text-text-secondary">This paragraph fades up on view.</p>
        </Reveal>
        <Stagger className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['One', 'Two', 'Three', 'Four'].map((n) => (
            <StaggerItem key={n}>
              <Card className="text-center">{n}</Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </div>
  )
}
