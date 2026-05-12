import { Toaster as SonnerToaster } from 'sonner';

function Toaster(props) {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm border shadow-lg',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
