/**
 * Toast.tsx — re-export shim now pointing to sonner (shadcn/ui standard).
 * Migration complete: all consumers have been updated to use sonner directly.
 * This shim is safe to delete once you confirm no remaining imports of Toast.tsx.
 */
export { Toaster } from '@/components/ui/sonner'
