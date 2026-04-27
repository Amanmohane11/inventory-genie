import { SnackbarProvider, useSnackbar, VariantType } from "notistack";
import { ReactNode } from "react";

export function NotifyProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={3000}
    >
      {children}
    </SnackbarProvider>
  );
}

export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();
  return (message: string, variant: VariantType = "default") =>
    enqueueSnackbar(message, { variant });
}
