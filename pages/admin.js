import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://xjkboyiszwrclireyecd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E8eTKRrsLnSHEYMD2V2MhQ_S9XUSV5l';

const SECTION_INFO = {
  A: "Graces", B: "Girl Scout Standards", C: "Camp Arrowhead Songs", D: "Patriotic Songs",
  E: "Traditional & Folk Songs", F: "Morning Songs", G: "Animal Songs", H: "Action Songs",
  I: "Silly Songs", J: "Food Songs", K: "Echo/Repeat Songs", L: "Campfire Songs",
  M: "Lullabies", N: "Friendship Songs", O: "Happiness, Fun & Laughter", P: "Love Songs",
  Q: "Peace Songs", R: "Outdoor Songs", S: "Songs to be Sung Together",
  T: "Rounds that need Translation", U: "Rounds & Canons", V: "Contemporary Folk Songs",
  W: "Kids' Movies & Musicals"
};

export default function Admin() {
  const [sessionName, setSessionName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('camp_admin_name') || '';
    }
    return '';
  });
  
  const [allSongs, setAllSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSong, setEditingSong] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formPage, setFormPage] = useState('');
  const [formOldPage, setFormOldPage] = useState('');
  const [formSection, setFormSection] = useState('A');
  const [formLyrics, setFormLyrics] = useState('');
  const [formHasLyrics, setFormHasLyrics] = useState(false);

  useEffect(() => { loadSongs(); }, []);

  const loadSongs = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?select=*&order=title.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      setAllSongs(await response.json());
    } catch (error) { console.error('Error loading songs:', error); }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const logChange = async (action, song, fieldChanged = null, oldValue = null, newValue = null, fullBefore = null, fullAfter = null) => {
    try {
      const payload = {
        action: action,
        song_id: song?.id || null,
        song_title: song?.title || fieldChanged,
        field_changed: fieldChanged,
        old_value: oldValue ? String(oldValue) : null,
        new_value: newValue ? String(newValue) : null,
        full_song_before: fullBefore,
        full_song_after: fullAfter,
        changed_by: sessionName || 'unknown'
      };

      await fetch(`${SUPABASE_URL}/rest/v1/change_log`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Logging Error:', error);
    }
  };

  const startEdit = (song) => {
    setEditingSong(song);
    setFormTitle(song.title);
    setFormPage(song.page || '');
    setFormOldPage(song.old_page || '');
    setFormSection(song.section || 'A');
    setIsAddingNew(false);
    setFormLyrics(song.lyrics_text || '');
    setFormHasLyrics(song.has_lyrics || false);
  };

  const startAddNew = () => {
    setEditingSong(null);
    setFormTitle('');
    setFormPage('');
    setFormOldPage('');
    setFormSection('A');
    setIsAddingNew(true);
    setFormLyrics('');
    setFormHasLyrics(false);
  };

  const cancelEdit = () => {
    setEditingSong(null);
    setIsAddingNew(false);
  };

  const saveSong = async () => {
    if (!sessionName.trim()) {
      showMessage('❌ Please enter your name at the top of the page before saving.');
      return;
    }
    if (!formTitle.trim()) {
      showMessage('Title is required');
      return;
    }
    setSaving(true);
    try {
      const newSongData = {
        title: formTitle.trim(),
        page: formPage.trim() || null,
        old_page: formOldPage.trim() || null,
        section: formSection,
        lyrics_text: formLyrics.trim() || null,
        has_lyrics: formLyrics.trim().length > 0
      };

      if (isAddingNew) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=representation'
          },
          body: JSON.stringify(newSongData)
        });
        if (response.ok) {
          const createdSong = await response.json();
          await logChange('add', createdSong[0], null, null, null, null, createdSong[0]);
          showMessage('Song added!');
          setIsAddingNew(false);
          await loadSongs();
        }
      } else {
        const oldSong = editingSong;
        const changes = [];
        if (oldSong.title !== newSongData.title) changes.push({ field: 'title', old: oldSong.title, new: newSongData.title });
        if (oldSong.page !== newSongData.page) changes.push({ field: 'page', old: oldSong.page, new: newSongData.page });
        if (oldSong.old_page !== newSongData.old_page) changes.push({ field: 'old_page', old: oldSong.old_page, new: newSongData.old_page });
        if (oldSong.section !== newSongData.section) changes.push({ field: 'section', old: oldSong.section, new: newSongData.section });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?id=eq.${editingSong.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newSongData)
        });
        if (response.ok) {
          const fullAfter = { ...oldSong, ...newSongData };
          for (const change of changes) {
            await logChange('edit', oldSong, change.field, change.old, change.new, oldSong, fullAfter);
          }
          showMessage('Song updated!');
          setEditingSong(null);
          await loadSongs();
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
    setSaving(false);
  };

  const deleteSong = async () => {
    if (!sessionName.trim()) {
      showMessage('❌ Please enter your name at the top of the page before deleting.');
      return;
    }
    if (!editingSong || !confirm(`Are you sure you want to delete "${editingSong.title}"?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?id=eq.${editingSong.id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (response.ok) {
        await logChange('delete', editingSong, null, null, null, editingSong, null);
        showMessage('Song deleted');
        setEditingSong(null);
        await loadSongs();
      }
    } catch (error) { console.error('Error deleting:', error); }
    setSaving(false);
  };

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.page && song.page.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const theme = {
    bg: '#111827',
    bgSecondary: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    primary: '#22c55e',
    border: '#374151',
    danger: '#dc2626'
  };

  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-green-500/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
              <span className="text-green-500">🎵</span> Song Admin
            </h1>
            <p className="text-slate-400 mt-1 font-medium">
              {allSongs.length} songs in database
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={startAddNew} 
              className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-green-900/20 focus:ring-4 focus:ring-green-500/50 outline-none"
            >
              + Add Song
            </button>
            <a 
              href="/" 
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-lg font-bold border border-slate-700 transition-all text-center focus:ring-4 focus:ring-slate-500/50 outline-none"
            >
              ← Back
            </a>
          </div>
        </header>

        {/* Sticky Name Bar - Accessible Version */}
        <section 
          className={`sticky top-4 z-50 p-4 rounded-xl mb-8 border transition-all duration-300 shadow-2xl flex flex-col sm:flex-row items-center gap-4 ${
            sessionName.trim() 
              ? 'bg-slate-800/95 backdrop-blur border-slate-700 shadow-black/50' 
              : 'bg-red-950/90 backdrop-blur border-red-500 shadow-red-900/20'
          }`}
        >
          <label htmlFor="admin-name" className="font-bold flex items-center gap-2 whitespace-nowrap">
            <span className="text-xl">👤</span> Your Name:
          </label>
          <input 
            id="admin-name"
            type="text" 
            placeholder="Type your name to unlock editing..." 
            value={sessionName} 
            onChange={(e) => {
              setSessionName(e.target.value);
              localStorage.setItem('camp_admin_name', e.target.value);
            }}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none transition-all" 
          />
          {!sessionName.trim() && (
            <span className="text-red-400 font-bold text-sm animate-pulse whitespace-nowrap text-center">
              ⚠️ Required to save
            </span>
          )}
        </section>

        {/* Status Message - Toast style */}
        {message && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-green-400 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span>✅</span> {message}
          </div>
        )}

        {/* Add/Edit Form Section */}
        {(editingSong || isAddingNew) && (
          <div className="bg-slate-800 border-2 border-green-500/30 rounded-2xl p-6 mb-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                {isAddingNew ? '✨ Add New Song' : `✏️ Editing: ${editingSong.title}`}
              </h2>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-white transition-colors">
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title Field */}
              <div className="md:col-span-2">
                <label htmlFor="formTitle" className="block text-sm font-bold text-slate-400 mb-2">Song Title *</label>
                <input 
                  id="formTitle"
                  type="text" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                />
              </div>

              {/* Section Select */}
              <div>
                <label htmlFor="formSection" className="block text-sm font-bold text-slate-400 mb-2">Category Section</label>
                <select 
                  id="formSection"
                  value={formSection} 
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all cursor-pointer"
                >
                  {Object.entries(SECTION_INFO).map(([letter, name]) => (
                    <option key={letter} value={letter}>{letter}: {name}</option>
                  ))}
                </select>
              </div>

              {/* Page Numbers Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="formPage" className="block text-sm font-bold text-slate-400 mb-2">New Page</label>
                  <input id="formPage" type="text" placeholder="F-2" value={formPage} onChange={(e) => setFormPage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label htmlFor="formOldPage" className="block text-sm font-bold text-slate-400 mb-2">Old Page</label>
                  <input id="formOldPage" type="text" placeholder="42" value={formOldPage} onChange={(e) => setFormOldPage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-green-500 outline-none" />
                </div>
              </div>

              {/* Lyrics Textarea */}
              <div className="md:col-span-2">
                <label htmlFor="formLyrics" className="block text-sm font-bold text-slate-400 mb-2">Lyrics Content</label>
                <textarea 
                  id="formLyrics"
                  value={formLyrics} 
                  onChange={(e) => setFormLyrics(e.target.value)}
                  placeholder="Paste lyrics here..."
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-mono text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-slate-700">
              <button 
                onClick={saveSong} 
                disabled={saving}
                className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-green-900/40"
              >
                {saving ? 'Saving...' : 'SAVE CHANGES'}
              </button>
              <button 
                onClick={cancelEdit}
                className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              
              {editingSong && (
                <button 
                  onClick={deleteSong} 
                  disabled={saving}
                  className="w-full md:w-auto md:ml-auto bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-6 py-3 rounded-xl font-bold transition-all border border-red-900/50"
                >
                  Delete Song
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer / Feedback */}
        <footer className="mt-20 mb-10 text-center border-t border-slate-800 pt-8">
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScwkZP7oISooLkhx-gksF5jjmjgMi85Z4WsKEC5eWU_Cdm9sg/viewform?usp=header"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-green-400 transition-colors font-medium text-sm"
          >
            <span>📝</span> Have feedback? Share it with the team
          </a>
        </footer>

      </div> {/* End of Max-Width Container */}
    </div> // End of Main Background
  );
}