import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type AnswerOption = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  otazka_id: number;
  kapitola: string;
  znenie_otazky: string;
  moznosti: AnswerOption[];
  spravne_odpovede: string[];
  kratke_vysvetlenie: string | null;
  sirsia_teoria: string | null;
  celkovy_vyklad: string | null;
};

type Subject = 'biologia' | 'chemia';

function App() {
  const [subject, setSubject] = useState<Subject>('biologia');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [evaluated, setEvaluated] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [showFullChapter, setShowFullChapter] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        // Vyberie tabuľku: 'otazky' pre biológiu, 'otazky_chemia' pre chémiu
        const tableName = subject === 'biologia' ? 'otazky' : 'otazky_chemia';
        
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;

        const mapped: Question[] = (data || []).map((item: any) => {
          let rawOptions = item.moznosti;
          if (typeof rawOptions === 'string') {
            try { rawOptions = JSON.parse(rawOptions); } catch (e) { rawOptions = []; }
          }
          
          const options: AnswerOption[] = Array.isArray(rawOptions)
            ? rawOptions.map((opt: any, idx: number) => ({
                id: opt.id || opt.letter || String.fromCharCode(65 + idx),
                text: opt.text || opt,
              }))
            : [];

          const correctAnswers = Array.isArray(rawOptions)
            ? rawOptions
                .filter((opt: any) => opt.correct === true)
                .map((opt: any, idx: number) => opt.id || opt.letter || String.fromCharCode(65 + idx))
            : [];

          return {
            id: item.id,
            otazka_id: item.cislo_otazky || item.id,
            kapitola: item.kapitola || 'Nezaradené',
            znenie_otazky: item.znenie_otazky || item.otazka || '',
            moznosti: options,
            spravne_odpovede: correctAnswers,
            kratke_vysvetlenie: item.kratke_vysvetlenie,
            sirsia_teoria: item.sirsia_teoria,
            celkovy_vyklad: item.celkovy_vyklad,
          };
        });

        setQuestions(mapped);
        setQuestionIndex(0);
        setSelectedAnswers([]);
        setEvaluated(false);
      } catch (err: any) {
        console.error('Chyba pri načítaní:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [subject]);

  if (loading) {
    return <div style={{ padding: '3rem', color: '#fff', textAlign: 'center', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh' }}>Načítavam dáta zo Supabase...</div>;
  }

  if (error || !questions.length) {
    return (
      <div style={{ padding: '3rem', color: '#ff6b6b', textAlign: 'center', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh' }}>
        <h3>Chyba pri načítaní</h3>
        <p>{error || 'Žiadne dáta v tabuľke.'}</p>
      </div>
    );
  }

  const question = questions[questionIndex] || questions[0];
  const progress = questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0;

  function toggleAnswer(answerId: string) {
    if (evaluated) return;
    setSelectedAnswers((current) => current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]);
  }

  function resetAnswers() {
    setSelectedAnswers([]);
    setEvaluated(false);
  }

  function goToQuestion(dir: number) {
    if (!questions.length) return;
    setQuestionIndex((curr) => (curr + dir + questions.length) % questions.length);
    resetAnswers();
  }

  if (showFullChapter) {
    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh' }}>
        <button onClick={() => setShowFullChapter(false)} style={{ background: '#475569', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '1.5rem' }}>← Späť na otázky</button>
        <h2>Celý výklad kapitoly: {question.kapitola}</h2>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', marginTop: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
          {question.celkovy_vyklad || 'Celkový výklad nie je k dispozícii.'}
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#1e293b', padding: '1rem', borderRadius: '12px' }}>
        <h2>Efaculty Trenažér</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setSubject('biologia')} style={{ background: subject === 'biologia' ? '#4f46e5' : 'transparent', color: '#fff', padding: '0.5rem 1rem', border: '1px solid #4f46e5', borderRadius: '6px', cursor: 'pointer' }}>Biológia</button>
          <button onClick={() => setSubject('chemia')} style={{ background: subject === 'chemia' ? '#4f46e5' : 'transparent', color: '#fff', padding: '0.5rem 1rem', border: '1px solid #4f46e5', borderRadius: '6px', cursor: 'pointer' }}>Chémia</button>
        </div>
      </header>

      <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Kapitola: {question.kapitola}</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Otázka č. {question.otazka_id} ({questionIndex + 1} z {questions.length})</span>
        </div>
        
        <div style={{ width: '100%', background: '#334155', height: '6px', borderRadius: '3px', marginBottom: '1.5rem' }}>
          <div style={{ width: `${progress}%`, background: '#4f46e5', height: '100%', borderRadius: '3px' }} />
        </div>

        <h3 style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>{question.znenie_otazky}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {question.moznosti.map((option) => {
            const isSelected = selectedAnswers.includes(option.id);
            return (
              <button key={option.id} onClick={() => toggleAnswer(option.id)} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: isSelected ? '#312e81' : '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                <b>{option.id}:</b> {option.text}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => goToQuestion(-1)} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Predchádzajúca</button>
          <button onClick={() => setEvaluated(true)} disabled={!selectedAnswers.length} style={{ background: evaluated ? '#059669' : '#4f46e5', color: '#fff', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{evaluated ? 'Vyhodnotené' : 'Vyhodnotiť'}</button>
          <button onClick={() => goToQuestion(1)} style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Nasledujúca →</button>
        </div>

        {evaluated && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#334155', borderRadius: '8px' }}>
            <p><strong>Krátke vysvetlenie:</strong> {question.kratke_vysvetlenie || 'Nie je k dispozícii.'}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setShowTheory(true)} style={{ background: '#0d9488', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Zobraziť širšiu teóriu</button>
              <button onClick={() => setShowFullChapter(true)} style={{ background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📖 Otvoriť celú kapitolu v skriptách</button>
            </div>
          </div>
        )}
      </div>

      {showTheory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #475569' }}>
            <h3>Širšia teória</h3>
            <p style={{ whiteSpace: 'pre-wrap', margin: '1rem 0', lineHeight: '1.6' }}>{question.sirsia_teoria || 'Širšia teória nie je k dispozícii.'}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowTheory(false)} style={{ background: '#475569', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Zavrieť</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
