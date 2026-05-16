import { Article } from './constants';

export function calculateReadingTime(article: Article): number {
  let text = `${article.title} ${article.description} `;

  const content = article.content;
  if (!content) return 1;

  // Para based content
  if (content.paragraphs) {
    if (typeof content.paragraphs[0] === 'string') {
      text += content.paragraphs.join(' ');
    } else if (content.paragraphs[0]?.text) {
      text += content.paragraphs.map((p: any) => p.text).join(' ');
    }
  }

  // Headline/Intro/Conclusion
  if (content.headline) text += content.headline;
  if (content.intro) text += content.intro;
  if (content.conclusion) text += content.conclusion;
  
  // Section based (NASA update)
  if (content.sections) {
    text += content.sections.map((s: any) => s.paragraph).join(' ');
  }

  // Fragment based
  if (content.fragments) {
    text += content.fragments.join(' ');
  }

  // Poem based
  if (content.poem) {
    text += content.poem.join(' ');
  }

  // Clean the text from markdown markers
  const cleanText = text.replace(/\[.*?\]/g, '').replace(/\*\*.*?\*\*/g, '').replace(/_.*?_/g, '');

  const words = cleanText.trim().split(/\s+/).length;
  const wpm = 200;
  return Math.max(1, Math.ceil(words / wpm));
}
