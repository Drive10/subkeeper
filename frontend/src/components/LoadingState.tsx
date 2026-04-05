import { LinearProgress, Box } from "@mui/material";

interface LoadingStateProps {
  loading?: boolean;
  children?: React.ReactNode;
}

export function LoadingState({ loading = false, children }: LoadingStateProps) {
  if (loading) {
    return (
      <Box
        sx={{ width: "100%", position: "fixed", top: 0, left: 0, zIndex: 9999 }}
      >
        <LinearProgress />
      </Box>
    );
  }
  return <>{children}</>;
}

export function PageLoader() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="400px"
    >
      <LinearProgress sx={{ width: "50%" }} />
    </Box>
  );
}
