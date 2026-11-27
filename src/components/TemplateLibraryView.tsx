import React, { useMemo, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  ReviewTemplate,
  ReviewerVoice,
} from '../types/reviews';

interface TemplateLibraryViewProps {
  templates: ReviewTemplate[];
  availableCategories: string[];
  onAddTemplate: (template: Omit<ReviewTemplate, 'id' | 'isCustom'>) => void;
  onDeleteTemplate: (id: string) => void;
}

const VOICE_OPTIONS: { value: ReviewerVoice; label: string }[] = [
  { value: 'minimalist', label: 'Short note' },
  { value: 'casual', label: 'Casual buyer' },
  { value: 'sports', label: 'Regular user' },
  { value: 'family', label: 'Household' },
  { value: 'technical', label: 'Detail-focused' },
];

export function TemplateLibraryView({
  templates,
  availableCategories,
  onAddTemplate,
  onDeleteTemplate,
}: TemplateLibraryViewProps) {
  const allCategories = useMemo(() => {
    const set = new Set<string>([
      'All Categories',
      ...availableCategories,
      ...templates.map((t) => t.category),
    ]);
    return Array.from(set);
  }, [availableCategories, templates]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<ReviewLanguage | 'all'>('all');
  const [selectedStar, setSelectedStar] = useState<number | 'all'>('all');

  const [newCategory, setNewCategory] = useState<string>(
    availableCategories[0] || 'All Categories'
  );
  const [newLanguage, setNewLanguage] = useState<ReviewLanguage>('en');
  const [newStars, setNewStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [newVoice, setNewVoice] = useState<ReviewerVoice>('casual');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedLanguage !== 'all' && t.language !== selectedLanguage) return false;
      if (selectedStar !== 'all' && t.stars !== selectedStar) return false;
      return true;
    });
  }, [templates, selectedCategory, selectedLanguage, selectedStar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newBody.trim()) return;
    onAddTemplate({
      category: newCategory,
      language: newLanguage,
      stars: newStars,
      voice: newVoice,
      subject: newSubject.trim(),
      body: newBody.trim(),
    });
    setNewSubject('');
    setNewBody('');
  };

  return (
    <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
          Custom Review Templates
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Add custom review lines for any category in your business. Dynamic tokens{' '}
          <code className="font-mono text-xs text-sky-800">{'{product}'}</code>,{' '}
          <code className="font-mono text-xs text-sky-800">{'{contextA}'}</code>,{' '}
          <code className="font-mono text-xs text-sky-800">{'{contextB}'}</code>,{' '}
          <code className="font-mono text-xs text-sky-800">{'{duration}'}</code>, and{' '}
          <code className="font-mono text-xs text-sky-800">{'{timeframe}'}</code> expand automatically.
        </p>
      </div>

      {/* Add Custom Template Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          Add Custom Review Template
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div>
            <label
              htmlFor="tpl-language"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Language
            </label>
            <select
              id="tpl-language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value as ReviewLanguage)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tpl-category"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Category
            </label>
            <select
              id="tpl-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tpl-stars"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Star Rating
            </label>
            <select
              id="tpl-stars"
              value={newStars}
              onChange={(e) =>
                setNewStars(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
              }
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} {s === 1 ? 'Star' : 'Stars'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tpl-voice"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Writing Voice
            </label>
            <select
              id="tpl-voice"
              value={newVoice}
              onChange={(e) => setNewVoice(e.target.value as ReviewerVoice)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tpl-subject"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Subject
            </label>
            <input
              id="tpl-subject"
              type="text"
              required
              dir={newLanguage === 'ar' ? 'rtl' : 'ltr'}
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder={
                newLanguage === 'darija_latin'
                  ? 'e.g. Wselni dghya w qualite zwina'
                  : 'e.g. Really happy with {product}'
              }
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="tpl-body"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            Review Body
          </label>
          <textarea
            id="tpl-body"
            required
            rows={3}
            dir={newLanguage === 'ar' ? 'rtl' : 'ltr'}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Write a natural review using {product}, {contextA}, {duration}, or {timeframe}..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newSubject.trim() || !newBody.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add to Pool</span>
          </button>
        </div>
      </form>

      {/* Template List */}
      <section className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Active Template Pool
            </h2>
            <span className="text-xs text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {filtered.length} templates
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter templates by language"
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as ReviewLanguage | 'all')
              }
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Languages</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter templates by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter templates by stars"
              value={selectedStar}
              onChange={(e) =>
                setSelectedStar(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stars</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} Stars
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-800">
                    {tpl.stars}.0
                    <Star
                      className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                      aria-hidden="true"
                    />
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">
                    {LANGUAGE_OPTIONS.find((l) => l.code === tpl.language)?.label ||
                      tpl.language}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">{tpl.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {VOICE_OPTIONS.find((v) => v.value === tpl.voice)?.label ||
                      tpl.voice}
                  </span>
                  {tpl.isCustom && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-700 font-medium">Custom</span>
                    </>
                  )}
                </div>
                <div dir={tpl.language === 'ar' ? 'rtl' : 'ltr'}>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {tpl.subject}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-[74ch]">
                    {tpl.body}
                  </p>
                </div>
              </div>

              {tpl.isCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(tpl.id)}
                  aria-label="Delete custom template"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
