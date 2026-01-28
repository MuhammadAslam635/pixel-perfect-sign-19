import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    item?: {
        name: string
        label: string
    } | null
    onConfirm: () => void
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    item,
    onConfirm,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {item && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-sm text-gray-400 mt-1">{item.name}</div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-700 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
