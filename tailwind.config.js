/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal:    '#00B2C0',
        'teal-hover': '#009AAA',
        'teal-dark':  '#1A7A85',
        'teal-light': '#E0F8FA',
        'teal-border':'#A8E6EC',
        'teal-sel':   '#E8F9FB',
        'page-bg':    '#F2F4F6',
        'surface':    '#FFFFFF',
        'text-dark':  '#191F28',
        'text-gray':  '#8B95A1',
        'text-body':  '#4A5568',
        'text-muted': '#B0B8C1',
        'border-def': '#E5E8EB',
        'valid':      '#00C73C',
        'valid-bg':   '#E8FBF0',
        'error':      '#F04452',
        'error-bg':   '#FFF0F2',
        'disabled-bg':'#E5E8EB',
        'cancel-bg':  '#F2F4F6',
        'cancel-text':'#4E5968',
      },
      borderRadius: {
        input: '10px',
        btn:   '10px',
        card:  '12px',
        modal: '20px 20px 0 0',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
