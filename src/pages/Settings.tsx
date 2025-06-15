import React from "react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-10 w-full max-w-lg border border-white/30">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-700 bg-clip-text text-transparent">Settings</h1>
        <p className="text-slate-600 mb-6">Manage your account, preferences, and more. (This is a placeholder page. Add your settings here!)</p>
        {/* Add settings form or options here */}
      </div>
    </div>
  );
};

export default Settings; 