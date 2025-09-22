import Footer from '../Footer';

export default function FooterExample() {
  return (
    <div>
      {/* Some page content to show footer context */}
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Page Content</h1>
        <p className="text-center text-gray-600">This shows how the footer looks at the bottom of a page.</p>
      </div>
      <Footer />
    </div>
  );
}