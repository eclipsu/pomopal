import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function ContinuePomodoroDialog({ open, setOpen, onContinue, onDiscard }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Continue previous session?</DialogTitle>
          <DialogDescription>
            You have an unfinished Pomodoro session. Would you like to continue from where you left
            off?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              onDiscard();
              setOpen(false);
            }}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Discard
          </button>

          <button
            onClick={() => {
              onContinue();
              setOpen(false);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ContinuePomodoroDialog;
