return (
  <div className="text-white p-6">
    <h1>Poker Page</h1>
    <p>UID: {uid || 'No UID'}</p>
    <p>Name: {userName}</p>
    <p>Balance: ₹{walletBalance}</p>
    <p>Loading: {authLoading ? 'Yes' : 'No'}</p>
    <p>Game State: {gameState}</p>
  </div>
);
