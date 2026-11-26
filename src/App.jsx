import React, { useEffect, useMemo, useState } from "react";

const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [users, setUsers] = useState(() => readStore("connect_users", []));
  const [posts, setPosts] = useState(() => readStore("connect_posts", []));
  const [notifications, setNotifications] = useState(() => readStore("connect_notifications", []));
  const [messages, setMessages] = useState(() => readStore("connect_messages", []));
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("connect_current_user") || "");
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [caption, setCaption] = useState("");
  const [postImage, setPostImage] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [search, setSearch] = useState("");
  const [receiver, setReceiver] = useState("");
  const [messageText, setMessageText] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => localStorage.setItem("connect_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("connect_posts", JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem("connect_notifications", JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem("connect_messages", JSON.stringify(messages)), [messages]);
  useEffect(() => {
    if (currentUser) localStorage.setItem("connect_current_user", currentUser);
    else localStorage.removeItem("connect_current_user");
  }, [currentUser]);

  const me = users.find((user) => user.username === currentUser);

  const myPosts = useMemo(
    () => posts.filter((post) => post.username === currentUser),
    [posts, currentUser]
  );
  const myNotifications = notifications.filter((item) => item.to === currentUser);

  function addNotification(to, text) {
    if (to && to !== currentUser) {
      setNotifications((old) => [{ id: uid(), to, text, createdAt: new Date().toLocaleString() }, ...old]);
    }
  }

  function handleAuth(event) {
    event.preventDefault();
    const name = username.trim();
    if (!name || !password.trim()) {
      setAuthError("Please enter both username and password.");
      return;
    }
    if (authMode === "register") {
      if (users.some((user) => user.username.toLowerCase() === name.toLowerCase())) {
        setAuthError("That username is already taken.");
        return;
      }
      setUsers((old) => [...old, { username: name, password, bio: "Hello! Welcome to my profile.", image: "", following: [] }]);
      setAuthError("Account created. You can now log in.");
      setAuthMode("login");
      setPassword("");
      return;
    }
    const found = users.find((user) => user.username === name && user.password === password);
    if (!found) {
      setAuthError("Incorrect username or password.");
      return;
    }
    setCurrentUser(found.username);
    setPage("home");
    setAuthError("");
    setPassword("");
  }

  function logout() {
    setCurrentUser("");
    setPassword("");
    setPage("home");
  }

  function fileToDataUrl(file, callback) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB for this browser demo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result));
    reader.readAsDataURL(file);
  }

  function createPost(event) {
    event.preventDefault();
    if (!caption.trim() && !postImage) {
      alert("Write a caption or select an image first.");
      return;
    }
    setPosts((old) => [{
      id: uid(),
      username: currentUser,
      caption: caption.trim(),
      image: postImage,
      likes: [],
      comments: [],
      createdAt: new Date().toLocaleString()
    }, ...old]);
    setCaption("");
    setPostImage("");
    event.currentTarget.reset();
  }

  function toggleLike(post) {
    const liked = post.likes.includes(currentUser);
    setPosts((old) => old.map((item) => item.id === post.id
      ? { ...item, likes: liked ? item.likes.filter((name) => name !== currentUser) : [...item.likes, currentUser] }
      : item
    ));
    if (!liked && post.username !== currentUser) addNotification(post.username, `${currentUser} liked your post.`);
  }

  function addComment(post) {
    const text = window.prompt("Write your comment:");
    if (!text?.trim()) return;
    setPosts((old) => old.map((item) => item.id === post.id
      ? { ...item, comments: [...item.comments, { id: uid(), username: currentUser, text: text.trim() }] }
      : item
    ));
    if (post.username !== currentUser) addNotification(post.username, `${currentUser} commented on your post.`);
  }

  function updateProfile(event) {
    event.preventDefault();
    setUsers((old) => old.map((user) => user.username === currentUser
      ? { ...user, bio: bioInput.trim() || user.bio, image: profileImage || user.image }
      : user
    ));
    setBioInput("");
    setProfileImage("");
    alert("Profile updated.");
  }

  function toggleFollow(name) {
    if (name === currentUser) return;
    const following = me.following.includes(name);
    setUsers((old) => old.map((user) => user.username === currentUser
      ? { ...user, following: following ? user.following.filter((item) => item !== name) : [...user.following, name] }
      : user
    ));
    if (!following) addNotification(name, `${currentUser} started following you.`);
  }

  function sendMessage(event) {
    event.preventDefault();
    const to = receiver.trim();
    if (!to || !messageText.trim()) return;
    if (!users.some((user) => user.username === to)) {
      alert("That user does not exist. Register another account to test messaging.");
      return;
    }
    setMessages((old) => [...old, {
      id: uid(), sender: currentUser, receiver: to,
      text: messageText.trim(), createdAt: new Date().toLocaleTimeString()
    }]);
    setMessageText("");
  }

  function renameAccount(event) {
    event.preventDefault();
    const next = newUsername.trim();
    if (!next || users.some((user) => user.username.toLowerCase() === next.toLowerCase())) {
      alert("Enter a new username that is not already in use.");
      return;
    }
    const previous = currentUser;
    setUsers((old) => old.map((user) => ({
      ...user,
      username: user.username === previous ? next : user.username,
      following: user.following.map((name) => name === previous ? next : name)
    })));
    setPosts((old) => old.map((post) => ({
      ...post,
      username: post.username === previous ? next : post.username,
      likes: post.likes.map((name) => name === previous ? next : name),
      comments: post.comments.map((comment) => ({
        ...comment, username: comment.username === previous ? next : comment.username
      }))
    })));
    setNotifications((old) => old.map((item) => ({
      ...item,
      to: item.to === previous ? next : item.to,
      text: item.text.replaceAll(previous, next)
    })));
    setMessages((old) => old.map((item) => ({
      ...item,
      sender: item.sender === previous ? next : item.sender,
      receiver: item.receiver === previous ? next : item.receiver
    })));
    setCurrentUser(next);
    setNewUsername("");
    alert("Username changed.");
  }

  function deleteAllData() {
    if (!window.confirm("This removes all Connect demo data from this browser. Continue?")) return;
    ["connect_users", "connect_posts", "connect_notifications", "connect_messages", "connect_current_user"]
      .forEach((key) => localStorage.removeItem(key));
    setUsers([]);
    setPosts([]);
    setNotifications([]);
    setMessages([]);
    setCurrentUser("");
  }

  if (!me) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="brand-mark">C</div>
          <h1>Connect</h1>
          <p className="muted">Share moments. Find your people.</p>
          <div className="tabs">
            <button type="button" className={authMode === "login" ? "tab active" : "tab"} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Login</button>
            <button type="button" className={authMode === "register" ? "tab active" : "tab"} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Register</button>
          </div>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete={authMode === "login" ? "current-password" : "new-password"} />
          {authError && <p className="form-message">{authError}</p>}
          <button className="primary full" type="submit">{authMode === "login" ? "Login" : "Create account"}</button>
          <p className="tiny muted">Demo project: account data is stored only in this browser.</p>
        </form>
      </div>
    );
  }

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase()) && user.username !== currentUser
  );
  const filteredPosts = posts.filter((post) =>
    `${post.username} ${post.caption}`.toLowerCase().includes(search.toLowerCase())
  );
  const chat = messages.filter((item) =>
    (item.sender === currentUser && item.receiver === receiver.trim()) ||
    (item.sender === receiver.trim() && item.receiver === currentUser)
  );

  const navItems = [
    ["home", "⌂", "Home"],
    ["profile", "◉", "Profile"],
    ["notifications", "♧", "Notifications"],
    ["search", "⌕", "Search"],
    ["follow", "+", "Discover"],
    ["messages", "✉", "Messages"],
    ["settings", "⚙", "Settings"]
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setPage("home"); }}>
          <span className="brand-mark small">C</span> Connect
        </a>
        <div className="topbar-right">
          <span className="welcome">Hello, {currentUser}</span>
          <button className="outline-button" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="side-user">
            <img src={me.image || "https://placehold.co/80x80?text=User"} alt="Your profile" />
            <div><strong>{currentUser}</strong><span>My account</span></div>
          </div>
          <nav className="side-nav" aria-label="Main navigation">
            {navItems.map(([id, icon, label]) => (
              <button key={id} className={page === id ? "nav-link selected" : "nav-link"} onClick={() => setPage(id)}>
                <span className="nav-icon">{icon}</span>{label}
                {id === "notifications" && myNotifications.length > 0 && <span className="count">{myNotifications.length}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">A place to share your world.</div>
        </aside>

        <main className="main-content">
          {page === "home" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">YOUR COMMUNITY</p><h1>Home feed</h1></div></div>
              <form className="panel composer" onSubmit={createPost}>
                <div className="composer-title"><img className="mini-avatar" src={me.image || "https://placehold.co/48x48?text=U"} alt="" /><strong>Share something, {currentUser}</strong></div>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What's happening in your world?" />
                <div className="composer-actions">
                  <label className="file-button">＋ Add photo<input type="file" accept="image/*" onChange={(e) => fileToDataUrl(e.target.files?.[0], setPostImage)} /></label>
                  {postImage && <span className="selected-file">Image ready ✓</span>}
                  <button className="primary" type="submit">Publish post</button>
                </div>
                {postImage && <img className="upload-preview" src={postImage} alt="Post preview" />}
              </form>
              <div className="feed-list">
                {posts.map((post) => (
                  <article className="panel post-card" key={post.id}>
                    <div className="post-author"><div className="avatar-placeholder">{post.username.slice(0, 1).toUpperCase()}</div><div><strong>{post.username}</strong><span>{post.createdAt}</span></div></div>
                    {post.caption && <p className="post-caption">{post.caption}</p>}
                    {post.image && <img className="post-photo" src={post.image} alt="Post" />}
                    <div className="post-stats">{post.likes.length} likes · {post.comments.length} comments</div>
                    <div className="post-actions">
                      <button className={post.likes.includes(currentUser) ? "action-button liked" : "action-button"} onClick={() => toggleLike(post)}>{post.likes.includes(currentUser) ? "♥ Liked" : "♡ Like"}</button>
                      <button className="action-button" onClick={() => addComment(post)}>▢ Comment</button>
                    </div>
                    {post.comments.length > 0 && <div className="comment-list">{post.comments.map((comment) => <p key={comment.id}><strong>{comment.username}</strong> {comment.text}</p>)}</div>}
                  </article>
                ))}
                {posts.length === 0 && <div className="empty-state"><span>✦</span><h3>Your feed is waiting</h3><p>Create the first post and start the conversation.</p></div>}
              </div>
            </>
          )}

          {page === "profile" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">YOUR SPACE</p><h1>My profile</h1></div></div>
              <section className="panel profile-panel">
                <img className="profile-avatar" src={me.image || "https://placehold.co/120x120?text=User"} alt="Profile" />
                <h2>{currentUser}</h2><p className="muted">{me.bio}</p>
                <div className="profile-stats"><div><strong>{myPosts.length}</strong><span>Posts</span></div><div><strong>{users.filter((u) => u.following.includes(currentUser)).length}</strong><span>Followers</span></div><div><strong>{me.following.length}</strong><span>Following</span></div></div>
              </section>
              <form className="panel form-panel" onSubmit={updateProfile}>
                <h3>Edit profile</h3>
                <label>Bio</label><input value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder={me.bio} />
                <label>Profile picture</label><input type="file" accept="image/*" onChange={(e) => fileToDataUrl(e.target.files?.[0], setProfileImage)} />
                {profileImage && <img className="upload-preview avatar-preview" src={profileImage} alt="New profile preview" />}
                <button className="primary" type="submit">Save profile</button>
              </form>
              <h2 className="section-title">My posts</h2>
              {myPosts.map((post) => <article className="panel post-card" key={post.id}><p>{post.caption}</p>{post.image && <img className="post-photo" src={post.image} alt="My post" />}</article>)}
              {myPosts.length === 0 && <p className="muted">You have not published any posts yet.</p>}
            </>
          )}

          {page === "notifications" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">WHAT'S NEW</p><h1>Notifications</h1></div></div>
              <section className="panel list-panel">
                {myNotifications.map((item) => <div className="list-row" key={item.id}><span className="notification-dot">•</span><div><strong>{item.text}</strong><span>{item.createdAt}</span></div></div>)}
                {myNotifications.length === 0 && <div className="empty-state"><span>♧</span><h3>All caught up</h3><p>Your new likes, comments and follows will appear here.</p></div>}
              </section>
            </>
          )}

          {page === "search" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">EXPLORE CONNECT</p><h1>Search</h1></div></div>
              <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people or post captions..." />
              <h2 className="section-title">People</h2>
              {filteredUsers.map((user) => <div className="panel user-row" key={user.username}><div className="avatar-placeholder">{user.username[0].toUpperCase()}</div><strong>{user.username}</strong><button className="primary" onClick={() => toggleFollow(user.username)}>{me.following.includes(user.username) ? "Following" : "Follow"}</button></div>)}
              <h2 className="section-title">Posts</h2>
              {filteredPosts.map((post) => <article className="panel post-card" key={post.id}><strong>{post.username}</strong><p>{post.caption}</p>{post.image && <img className="post-photo" src={post.image} alt="Search result" />}</article>)}
              {filteredUsers.length === 0 && filteredPosts.length === 0 && <p className="muted">No matching people or posts.</p>}
            </>
          )}

          {page === "follow" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">MEET PEOPLE</p><h1>Discover people</h1></div></div>
              {users.filter((user) => user.username !== currentUser).map((user) => <div className="panel user-row" key={user.username}><div className="avatar-placeholder">{user.username[0].toUpperCase()}</div><div className="user-info"><strong>{user.username}</strong><span>{user.bio}</span></div><button className={me.following.includes(user.username) ? "outline-button" : "primary"} onClick={() => toggleFollow(user.username)}>{me.following.includes(user.username) ? "Unfollow" : "Follow"}</button></div>)}
              {users.length <= 1 && <div className="empty-state"><span>＋</span><h3>No other users yet</h3><p>Create another demo account in a separate browser session to test following.</p></div>}
            </>
          )}

          {page === "messages" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">PRIVATE CONVERSATIONS</p><h1>Messages</h1></div></div>
              <section className="panel form-panel">
                <label>Chat with (username)</label><input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Enter another registered username" />
                <div className="chat-window">
                  {chat.map((item) => <div key={item.id} className={item.sender === currentUser ? "chat-message mine" : "chat-message"}><strong>{item.sender}</strong><p>{item.text}</p><span>{item.createdAt}</span></div>)}
                  {chat.length === 0 && <p className="muted">Choose a username to view the conversation.</p>}
                </div>
                <form className="send-row" onSubmit={sendMessage}><input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message..." /><button className="primary" type="submit">Send</button></form>
              </section>
            </>
          )}

          {page === "settings" && (
            <>
              <div className="page-heading"><div><p className="eyebrow">ACCOUNT PREFERENCES</p><h1>Settings</h1></div></div>
              <form className="panel form-panel" onSubmit={renameAccount}>
                <h3>Change username</h3><label>New username</label><input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter a new username" /><button className="primary" type="submit">Save username</button>
              </form>
              <section className="panel form-panel"><h3>Session</h3><p className="muted">You are logged in as {currentUser}.</p><button className="outline-button" onClick={logout}>Log out</button></section>
              <section className="panel form-panel danger-panel"><h3>Danger zone</h3><p className="muted">Delete all Connect demo data saved in this browser.</p><button className="danger" onClick={deleteAllData}>Delete all project data</button></section>
            </>
          )}
        </main>
      </div>
      <footer className="footer">Connect · Social media frontend project</footer>
    </div>
  );
}