import { checkAuth } from '../(auth)/actions';

export default async function SchedulePage() {
  await checkAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
          Coming Soon
        </h1>
        <p className="text-muted-foreground text-lg">
          Schedule Post page is under development
        </p>
        <div className="mt-8 w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
      </div>
    </div>
  );
}
