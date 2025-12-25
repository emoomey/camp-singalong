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

const ROOM_CODE_WORDS = [
  'SUNSHINE', 'MOONLIGHT', 'STARLIGHT', 'RAINBOW', 'BARGES', 'CAMPFIRE',
  'MOUNTAIN', 'MEADOW', 'RIVER', 'FOREST', 'WILDFLOWER', 'BLACKBERRY',
  'SPARROW', 'TURTLE', 'CRICKET', 'HARMONY', 'MELODY', 'LULLABY',
  'CANOE', 'LANTERN', 'DEWDROP', 'SUNRISE', 'SUNSET', 'MAGIC',
  'DREAM', 'WIND', 'PEACE', 'FRIENDS', 'LINGER', 'WANDER',
  'ROVER', 'HAPPY', 'BUGS', 'LAKE', 'WANEEYA', 'ELAHAN',
  'TAHOMA', 'MOWICH', 'KLICKITAT', 'LOOWIT', 'TYHEE', 'ILLAHEE',
  'WYEAST', 'CELILO', 'ROMANY', 'CHEESIAH', 'DOGMTN', 'WINDMTN',
  'TAJAR', 'PHIF', 'TILLIE', 'CEDAR', 'MAPLE', 'HEMLOCK',
  'ALDER', 'CASCADE', 'GORGE', 'RAPIDS', 'SALMON', 'TRILLIUM',
  'FERN', 'MOSS', 'HUCKLEBERRY', 'CHINOOK', 'RAVEN', 'EAGLE',
  'VOLCANO', 'LANDSLIDE', 'BANDANA', 'TRAILHEAD', 'SUMMIT', 'RIDGE',
  'CREEK', 'PINE', 'SPRUCE', 'EVERGREEN', 'PIXIE'
];

const generateRoomCode = () => {
  const word = ROOM_CODE_WORDS[Math.floor(Math.random() * ROOM_CODE_WORDS.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return word + number;
};

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [view, setView] = useState('control');
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [sungSongs, setSungSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSections, setSelectedSections] = useState(Object.keys(SECTION_INFO));
  const [showSectionFilter, setShowSectionFilter] = useState(false);
  const [customSongInput, setCustomSongInput] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showLyricsOnTV, setShowLyricsOnTV] = useState(false);

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeQuery.matches);
    const handler = (e) => setIsDark(e.matches);
    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => { loadSongs(); }, []);

  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(() => { loadRoomData(); }, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const loadSongs = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/songs?select=*&order=title.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      setAllSongs(await response.json());
    } catch (error) { console.error('Error loading songs:', error); }
  };

  const createRoom = async () => {
    const code = generateRoomCode();
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rooms`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ id: code, current_song: null, sung_songs: [] })
      });
      if (response.ok) setRoomCode(code);
    } catch (error) { console.error('Error creating room:', error); }
    setLoading(false);
  };

  const joinRoom = async () => {
    const code = roomCodeInput.toUpperCase().trim();
    if (!code) return;
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.${code}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await response.json();
      if (data && data.length > 0) { setRoomCode(code); await loadRoomData(); }
      else alert('Room not found!');
    } catch (error) { console.error('Error joining room:', error); alert('Error joining room'); }
    setLoading(false);
  };

  const loadRoomData = async () => {
    if (!roomCode) return;
    try {
      const roomResponse = await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.${roomCode}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const roomData = await roomResponse.json();
      if (roomData && roomData.length > 0) {
        setCurrentSong(roomData[0].current_song);
        setSungSongs(roomData[0].sung_songs || []);
      }
      const queueResponse = await fetch(`${SUPABASE_URL}/rest/v1/queue?room_id=eq.${roomCode}&select=*&order=position.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      setQueue((await queueResponse.json()) || []);
    } catch (error) { console.error('Error loading room data:', error); }
  };

  const updateRoom = async (updates) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.${roomCode}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });
    } catch (error) { console.error('Error updating room:', error); }
  };

  const addToQueue = async (song, requester = 'Someone') => {
    if (queue.some(s => s.song_title === song.title)) return;
    const maxPosition = queue.length > 0 ? Math.max(...queue.map(s => s.position)) : -1;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/queue`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          room_id: roomCode,
          song_title: song.title,
          song_page: song.page,
          song_section: song.section,
          requester: requester,
          position: maxPosition + 1,
          old_page: song.old_page || null,
          has_lyrics: song.has_lyrics || false,
          lyrics_text: song.lyrics_text || null
        })
      });
    } catch (error) { console.error('Error adding to queue:', error); }
    await loadRoomData();
  };

  const generateRandomSong = () => {
    const availableSongs = allSongs.filter(song =>
      selectedSections.includes(song.section) && !sungSongs.some(s => s.title === song.title)
    );
    if (availableSongs.length === 0) { alert('No songs available with current filters!'); return; }
    addToQueue(availableSongs[Math.floor(Math.random() * availableSongs.length)], 'Random');
  };

  const playSong = async (song) => {
    const songObj = {
      title: song.song_title,
      page: song.song_page,
      section: song.song_section,
      old_page: song.old_page,
      has_lyrics: song.has_lyrics || false,
      lyrics_text: song.lyrics_text || null
    };
    await updateRoom({ current_song: songObj, sung_songs: [...sungSongs, songObj] });
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/queue?id=eq.${song.id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
    } catch (error) { console.error('Error removing from queue:', error); }
    await loadRoomData();
  };

  const moveInQueue = async (song, direction) => {
    const currentIndex = queue.findIndex(s => s.id === song.id);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= queue.length) return;
    const otherSong = queue[newIndex];
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/queue?id=eq.${song.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ position: otherSong.position })
      });
      await fetch(`${SUPABASE_URL}/rest/v1/queue?id=eq.${otherSong.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ position: song.position })
      });
      await loadRoomData();
    } catch (error) { console.error('Error reordering queue:', error); }
  };

  const removeFromQueue = async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/queue?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      await loadRoomData();
    } catch (error) { console.error('Error removing from queue:', error); }
  };

  const toggleSection = (section) => {
    setSelectedSections(selectedSections.includes(section)
      ? selectedSections.filter(s => s !== section)
      : [...selectedSections, section]);
  };

  const addCustomSong = () => {
    if (customSongInput.trim()) {
      addToQueue({ title: customSongInput.trim(), page: 'Custom', section: 'Custom' });
      setCustomSongInput('');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSongs = allSongs.filter(song => {
  const searchLower = searchTerm.toLowerCase().trim();
  if (!searchLower) return true;

  const matchesTitle = song.title.toLowerCase().includes(searchLower);
  const matchesPage = (song.page && song.page.toLowerCase().includes(searchLower)) || 
                      (song.old_page && song.old_page.toLowerCase().includes(searchLower));
  
  const sectionName = SECTION_INFO[song.section] || "";
  const matchesSection = song.section?.toLowerCase() === searchLower || 
                         sectionName.toLowerCase().includes(searchLower);

  return matchesTitle || matchesPage || matchesSection;
});

  // Landing Page - No Room Code

  
// Landing Page - No Room Code
  if (!roomCode) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-green-50'}`}>
        <div className={`shadow-2xl rounded-3xl p-8 w-full max-w-md border animate-in fade-in zoom-in duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'}`}>
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 drop-shadow-lg">🎵</div>
            <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-green-900'}`}>
              Camp <span className="text-green-600">Singalong</span>
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-green-700/70'}`}>
              Ready to lead the choir?
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xl transition-all active:scale-[0.98] shadow-xl shadow-green-900/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Start New Room'}
            </button>

            <div className="relative flex items-center py-2">
              <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-green-100'}`}></div>
              <span className={`flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-green-300'}`}>OR JOIN ROOM</span>
              <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-green-100'}`}></div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CODE"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  className={`flex-1 border-2 rounded-2xl px-4 py-3 text-xl font-black tracking-widest transition-all outline-none focus:ring-4 focus:ring-green-500/10 ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-green-500 placeholder:text-slate-800' 
                      : 'bg-green-50 border-green-100 text-green-900 focus:border-green-500 placeholder:text-green-200'
                  }`}
                />
                <button
                  onClick={joinRoom}
                  disabled={loading || !roomCodeInput}
                  className="px-6 py-3 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-30 shadow-lg shadow-blue-900/20"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-0 right-0 text-center">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScwkZP7oISooLkhx-gksF5jjmjgMi85Z4WsKEC5eWU_Cdm9sg/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-green-500 text-sm font-medium transition-colors"
          >
            📝 Share Feedback
          </a>
        </div>
      </div>
    );
  }



  // Display View - Full Screen Lyrics
  if (view === 'display' && showLyrics && currentSong) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-green-900 via-green-700 to-green-900'} text-white`}>
        {/* Sticky Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur p-3 sm:p-4 z-10 border-b border-white/10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button
              onClick={() => setShowLyrics(false)}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="text-center">
              <div className="text-base sm:text-xl font-bold">{currentSong.title}</div>
              <div className="text-xs sm:text-sm text-green-300">
                Page {currentSong.page}{currentSong.old_page ? ` (${currentSong.old_page})` : ''}
              </div>
            </div>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>

        {/* Scrollable Lyrics */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-sm text-green-300 mb-4 text-center">Now Singing</div>
            {currentSong.lyrics_text ? (
              <div className="text-base sm:text-lg lg:text-xl tv:text-2xl leading-relaxed whitespace-pre-wrap">
                {currentSong.lyrics_text}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-5xl mb-4">📄</div>
                <div>No lyrics available for this song</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="p-4 bg-black/80 border-t border-white/10">
          <button
            onClick={() => setShowLyrics(false)}
            className={`w-full max-w-3xl mx-auto block py-3 rounded-lg font-semibold transition-colors
              ${isDark ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  // Display View - Main
  if (view === 'display') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-green-900 via-green-700 to-green-900'} text-white`}>
        {/* Header */}
        <div className="flex justify-between items-start p-3 sm:p-4 flex-wrap gap-2">
          <div className="bg-white/20 px-3 py-2 sm:px-4 rounded-lg">
            <div className="text-xs text-green-300">Room Code</div>
            <div className="text-lg sm:text-xl font-bold">{roomCode}</div>
          </div>
          <button
            onClick={() => setView('control')}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            📱 Control View
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 tv:px-8">
          {/* Now Singing */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl tv:text-6xl font-bold mb-2">🎵 Now Singing</h1>
            {currentSong ? (
              <>
                <div className="text-3xl sm:text-5xl lg:text-6xl tv:text-7xl font-bold mb-2">{currentSong.title}</div>
                <div className="text-2xl sm:text-4xl lg:text-5xl tv:text-6xl text-green-300">
                  Page {currentSong.page}{currentSong.old_page ? ` (${currentSong.old_page})` : ''}
                </div>

                {/* View Lyrics Button */}
                {currentSong.has_lyrics && (
                  <button
                    onClick={() => setShowLyrics(true)}
                    className={`mt-4 px-6 py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors
                      ${isDark ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    📄 View Lyrics
                  </button>
                )}

                {/* TV Lyrics Display */}
                {showLyricsOnTV && currentSong.lyrics_text && (
                  <div className="mt-6 sm:mt-8 text-left bg-white/10 rounded-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                    <div className="text-base sm:text-lg lg:text-xl tv:text-2xl leading-relaxed whitespace-pre-wrap">
                      {currentSong.lyrics_text}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-2xl sm:text-4xl lg:text-5xl tv:text-6xl text-green-400">Pick a song to start!</div>
            )}
          </div>

          {/* Up Next Queue */}
          <div className="bg-white/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl tv:text-4xl font-bold mb-4">👥 Up Next ({queue.length})</h2>
            {queue.length === 0 ? (
              <p className="text-lg sm:text-xl lg:text-2xl tv:text-3xl text-green-300">No songs in queue yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {queue.slice(0, 8).map((song, idx) => (
                  <div key={song.id} className="bg-white/10 rounded-xl p-3 sm:p-4 flex justify-between items-center">
                    <div>
                      <div className="text-base sm:text-xl lg:text-2xl tv:text-3xl font-semibold">
                        {idx + 1}. {song.song_title}
                        {song.has_lyrics && <span className="ml-2 text-sm" title="Lyrics available">📄</span>}
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg tv:text-xl text-green-300">
                        Page {song.song_page}{song.old_page ? ` (${song.old_page})` : ''}
                      </div>
                      <div className="text-sm sm:text-lg lg:text-xl tv:text-2xl text-green-400">- {song.requester}</div>
                    </div>
                  </div>
                ))}
                {queue.length > 8 && (
                  <div className="text-sm sm:text-lg lg:text-xl tv:text-2xl text-green-400 text-center">
                    + {queue.length - 8} more songs
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

 // Control View
  return (
    <div className={`min-h-screen p-2 sm:p-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-green-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">

        {/* Header Card */}
        <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              🎵 Camp Singalong
            </h1>
            <button
              onClick={() => setView('display')}
              className="w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors"
            >
              📺 Display View
            </button>
          </div>

          {/* Room Code */}
          <div className={`flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">Room Code</div>
              <div className="text-2xl font-black">{roomCode}</div>
            </div>
            <button
              onClick={copyRoomCode}
              className="w-full sm:w-auto px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-500"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Queue Section */}
        <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            👥 Up Next <span className="text-sm font-normal opacity-60">({queue.length} songs)</span>
          </h2>

          {queue.length === 0 ? (
            <p className="text-center py-8 opacity-50">No songs in queue</p>
          ) : (
            <div className="space-y-2">
              {queue.map((song) => (
                <div key={song.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveInQueue(song, -1)} className="p-1 hover:bg-green-500/20 rounded text-xs">▲</button>
                    <button onClick={() => moveInQueue(song, 1)} className="p-1 hover:bg-green-500/20 rounded text-xs">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate flex items-center gap-2">
                      {song.song_title}
                      {song.has_lyrics && <span title="Lyrics Available">📄</span>}
                    </div>
                    <div className="text-xs opacity-70">Page {song.song_page} • {song.requester}</div>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => playSong(song)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => removeFromQueue(song.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History / Already Sung */}
        {sungSongs.length > 0 && (
          <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <h2 className="text-lg sm:text-xl font-bold mb-4 opacity-70">📜 Recently Sung</h2>
            <div className="flex flex-wrap gap-2">
              {sungSongs.slice().reverse().map((song, i) => (
                <div key={i} className={`px-3 py-1 rounded-full text-xs font-medium border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                  {song.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request a Song */}
        <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <h2 className="text-lg sm:text-xl font-bold mb-4">Add to Queue</h2>
          <input
            type="text"
            placeholder="Search by title, page, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl mb-4 border focus:ring-2 focus:ring-green-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
          />
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {filteredSongs.slice(0, 50).map(song => (
              <div key={song.id} className={`flex justify-between items-center p-3 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{song.title} {song.has_lyrics && '📄'}</div>
                  <div className="text-xs opacity-60 text-green-600 font-bold uppercase">Section {song.section} • Page {song.page}</div>
                </div>
                <button
                  onClick={() => addToQueue(song)}
                  className="ml-3 p-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                >
                  ➕
                </button>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm font-bold mb-2 opacity-70">Unlisted Song:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Song Title..."
                value={customSongInput}
                onChange={(e) => setCustomSongInput(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
              />
              <button onClick={addCustomSong} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}