import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { CreateVideoFlow } from './components/CreateVideoFlow';
import { FFmpegProvider } from '@/contexts/FFmpegContext';

export default function CreateVideoPage() {
    return (
        <FFmpegProvider>
            <CreateVideoFlow />
        </FFmpegProvider>
    );
}
