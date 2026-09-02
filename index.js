// NAMITA STORE - Core Application Engine

const App = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">NAMITA STORE Dashboard</h1>
      <p className="text-gray-600">আপনার সিস্টেমটি সফলভাবে চালু হয়েছে!</p>
    </div>
  );
};

if (typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log("NAMITA STORE App Loaded Successfully.");
  }
}
এই দুটি ফাইল এভাবে সেভ করার পর আপনার Vercel বা সাইটের লিংকে পেজটি রিলোড করে দেখুন ড্যাশবোর্ড দেখাচ্ছে কিনা।

ফাইল দুটি সেভ করতে কি কোনো অসুবিধা হচ্ছে?
