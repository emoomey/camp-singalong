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
    if (typeof window !== 'undefined') return localStorage.getItem('camp_admin_name') || '';
    return '';
  });
  
  const [allSongs, setAllSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSong, setEditingSong] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formPage, setFormPage] = useState('');
  const [formOldPage, setFormOldPage] = useState('');
  const [formSection, setFormSection] = useState('A');
  const [formLyrics, setFormLyrics] = useState('');

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeQuery.matches);
    const handler = (e) => setIsDark(e.matches);
    darkModeQuery.addEventListener('change', handler);
    loadSongs();
    return () => darkModeQuery.removeEventListener('change', handler);
  }, []);

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
        action, song_id: song?.id || null, song_title: song?.title || fieldChanged,
        field_changed: fieldChanged, old_value: oldValue ? String(oldValue) : null,
        new_value: newValue ? String(newValue) : null, full_song_before: fullBefore,
        full_song_after: fullAfter, changed_by: sessionName || 'unknown'
      };
      await fetch(`${SUPABASE_URL}/rest/v1/change_log`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) { console.error('Logging Error:', error); }
  };

  const startEdit = (song) => {
    setEditingSong(song);
    setFormTitle(song.title);
    setFormPage(song.page || '');
    setFormOldPage(song.old_page || '');
    setFormSection(song.section || 'A');
    setFormLyrics(song.lyrics_text || '');
    setIsAddingNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAddNew = () => {
    setEditingSong(null);
    setFormTitle('');
    setFormPage('');
    setFormOldPage('');
    setFormSection('A');
    setFormLyrics('');
    setIsAddingNew(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveSong = async () => {
    if (!sessionName.trim()) { showMessage('❌ Enter name to save'); return; }
    if (!formTitle.trim()) { showMessage('Title required'); return; }
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
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(newSongData)
        });
        if (response.ok) {
          const created = await response.json();
          await logChange('add', created[0], null, null, null, null, created[0]);
          showMessage('Song added!');
          setIsAddingNew(false);
          loadSongs();
        }
      } else {
        const oldSong = editingSong;
        const changes = [];
        if (oldSong.title !== newSongData.title) changes.push({ field: 'title', old: oldSong.title, new: newSongData.title });
        if (oldSong.page !== newSongData.page) changes.push({ field: 'page', old: oldSong.page, new: newSongData.page });
        if (oldSong.section !== newSongData.section) changes.push({ field: 'section', old: oldSong.section, new: newSongData.section });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?id=eq.${editingSong.id}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(newSongData)
        });
        if (response.ok) {
          for (const change of changes) await logChange('edit', oldSong, change.field, change.old, change.new, oldSong, { ...oldSong, ...newSongData });
          showMessage('Song updated!');
          setEditingSong(null);
          loadSongs();
        }
      }
    } catch (error) { console.error('Error saving:', error); }
    setSaving(false);
  };

  const deleteSong = async () => {
    if (!sessionName.trim()) { showMessage('❌ Name required to delete'); return; }
    if (!editingSong || !confirm(`Delete "${editingSong.title}"?`)) return;
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
        loadSongs();
      }
    } catch (error) { console.error('Error deleting:', error); }
    setSaving(false);
  };

  const handleBulkAdd = async () => {
    if (!sessionName.trim()) { showMessage('❌ Name required'); return; }
    const lines = bulkText.split('\n');
    const songsToAdd = lines.map(line => {
      const [title, page, section, old_page] = line.split('\t');
      return title ? { title, page, section, old_page: old_page || null, has_lyrics: false } : null;
    }).filter(Boolean);

    setSaving(true);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(songsToAdd)
    });
    if (response.ok) {
      await logChange('bulk_add', null, `${songsToAdd.length} songs`, null, null, null, null);
      setBulkText('');
      loadSongs();
      showMessage('Bulk upload complete!');
    }
    setSaving(false);
  };

  const filteredSongs = allSongs.filter(song => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    return song.title.toLowerCase().includes(s) || (song.page && song.page.toLowerCase().includes(s)) || (song.section && song.section.toLowerCase() === s);
  });

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Database <span className="text-blue-600">Admin</span>
            </h1>
            <p className="opacity-50 text-xs font-bold uppercase tracking-widest">{allSongs.length} Songs Loaded</p>
          </div>
          <div className="flex gap-2">
            <button onClick={startAddNew} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-500 transition-all">+ ADD SONG</button>
            <a href="/" className={`px-6 py-2.5 rounded-xl font-black text-sm border transition-all ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-white'}`}>BACK</a>
          </div>
        </header>

        {/* Identity Lock Bar */}
        <div className={`sticky top-4 z-50 p-4 rounded-2xl mb-8 border-2 transition-all shadow-xl flex flex-col sm:flex-row items-center gap-4 ${
          sessionName.trim() ? (isDark ? 'bg-slate-900 border-blue-900/50' : 'bg-white border-blue-100') : 'bg-red-500 text-white border-red-400'
        }`}>
          <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">Admin Identity:</span>
          <input 
            type="text" placeholder="Type name to enable editing..." value={sessionName} 
            onChange={(e) => { setSessionName(e.target.value); localStorage.setItem('camp_admin_name', e.target.value); }}
            className={`w-full px-4 py-2 rounded-lg font-bold outline-none transition-all ${isDark ? 'bg-slate-800 text-white focus:ring-2 focus:ring-blue-500' : 'bg-slate-100 text-slate-900 focus:ring-2 focus:ring-blue-500'}`}
          />
        </div>

        {/* Form Area */}
        {(editingSong || isAddingNew) && (
          <div className={`p-6 rounded-3xl shadow-2xl mb-12 border-2 animate-in slide-in-from-top-4 duration-300 ${isDark ? 'bg-slate-900 border-blue-900/50' : 'bg-white border-blue-100'}`}>
            <div className="flex justify-between mb-6">
              <h2 className="font-black uppercase tracking-widest text-blue-500">{isAddingNew ? 'New Song' : 'Edit Song'}</h2>
              <button onClick={() => { setEditingSong(null); setIsAddingNew(false); }} className="opacity-50 hover:opacity-100 font-black">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase opacity-50 mb-1 block">Title</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-50 mb-1 block">Section</label>
                <select value={formSection} onChange={e => setFormSection(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {Object.entries(SECTION_INFO).map(([k, v]) => <option key={k} value={k}>{k}: {v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-50 mb-1 block">Page</label>
                  <input type="text" value={formPage} onChange={e => setFormPage(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-50 mb-1 block">Old Page</label>
                  <input type="text" value={formOldPage} onChange={e => setFormOldPage(e.target.value)} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase opacity-50 mb-1 block">Lyrics</label>
                <textarea value={formLyrics} onChange={e => setFormLyrics(e.target.value)} rows={6} className={`w-full p-3 rounded-xl border font-mono text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={saveSong} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">Save</button>
              {!isAddingNew && <button onClick={deleteSong} className="px-6 bg-red-600/10 text-red-500 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Delete</button>}
            </div>
          </div>
        )}

        {/* Main List */}
        <div className="space-y-4">
          <input 
            type="text" placeholder="Search Database..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className={`w-full p-4 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
          />
          <div className={`rounded-3xl border overflow-hidden shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className={`sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Section</th>
                    <th className="px-6 py-3">Page</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filteredSongs.map(song => (
                    <tr key={song.id} className="hover:bg-blue-500/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{song.title} {song.has_lyrics && '📄'}</td>
                      <td className="px-6 py-4 opacity-50 font-black">{song.section}</td>
                      <td className="px-6 py-4 opacity-50">{song.page}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => startEdit(song)} className="text-blue-500 font-black text-xs uppercase tracking-widest">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bulk Upload Section */}
        <div className={`mt-12 p-6 rounded-3xl border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className="font-black uppercase tracking-widest text-xs opacity-50 mb-4">Bulk Upload (TSV)</h2>
          <textarea 
            placeholder="Title [TAB] Page [TAB] Section [TAB] OldPage" value={bulkText} onChange={e => setBulkText(e.target.value)}
            className={`w-full h-32 p-3 rounded-xl border text-xs font-mono mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
          />
          <button onClick={handleBulkAdd} disabled={saving || !bulkText} className="w-full py-3 rounded-xl font-black border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30">UPLOAD LIST</button>
        </div>

        {message && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl animate-bounce">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}