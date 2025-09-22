import Navigation from '../Navigation';

export default function NavigationExample() {
  return (
    <div className="pb-20">
      <Navigation />
      <div className="pt-16 p-8">
        <h2 className="text-2xl font-bold">Page Content</h2>
        <p className="text-gray-600">This shows how the navigation looks with page content.</p>
      </div>
    </div>
  );
}