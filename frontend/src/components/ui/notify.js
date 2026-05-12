import { toast } from 'sonner';

const notify = (message, type = 'info') => {
  switch (type) {
    case 'success': toast.success(message); break;
    case 'error': toast.error(message); break;
    case 'warning': toast.warning(message); break;
    default: toast.info(message);
  }
};

export default notify;
