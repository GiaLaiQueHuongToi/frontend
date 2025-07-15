import { NotFound } from '@/components/ui/error';

export default function NotFoundPage() {
    return (
        <NotFound
            title='Page Not Found'
            description='The page you are looking for does not exist or has been moved.'
        />
    );
}
