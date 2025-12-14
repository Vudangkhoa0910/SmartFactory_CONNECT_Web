import { useState } from 'react';
import { toast } from 'react-toastify';
import { Copy } from 'lucide-react';
import api from '../services/api';
import PageMeta from '../components/common/PageMeta';

export default function TranslationTest() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('vi');
  const [targetLang, setTargetLang] = useState('ja');
  const [loading, setLoading] = useState(false);
  const [translationMethod, setTranslationMethod] = useState('');
  const [translationTime, setTranslationTime] = useState(0);

  // Sample texts for quick testing
  const sampleTexts = {
    vi: [
      'Xin chào, tôi là công nhân tại nhà máy',
      'Báo cáo sự cố nghiêm trọng tại Line 1',
      'Cải tiến Kaizen giúp tăng năng suất 20%',
      'Yêu cầu kiểm tra chất lượng sản phẩm',
      'Máy móc bị hỏng cần sửa chữa khẩn cấp'
    ],
    ja: [
      'こんにちは、私は工場の作業員です',
      'ライン1で重大なインシデントを報告',
      '改善により生産性が20%向上',
      '製品の品質検査をお願いします',
      '機械が故障し、緊急修理が必要です'
    ]
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast.error('Vui lòng nhập văn bản cần dịch');
      return;
    }

    setLoading(true);
    setTranslatedText('');
    setTranslationMethod('');
    
    const startTime = Date.now();

    try {
      const response = await api.post('/translations/translate', {
        text: inputText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        useMock: false
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.data.success) {
        setTranslatedText(response.data.data.translated);
        setTranslationMethod(response.data.data.method);
        setTranslationTime(duration);
        toast.success('Dịch thành công!');
      } else {
        toast.error('Lỗi khi dịch văn bản');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error('Lỗi kết nối API: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText('');
  };

  const handleUseSample = (text: string) => {
    setInputText(text);
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      vi: 'Tiếng Việt',
      ja: '日本語',
      en: 'English'
    };
    return names[code] || code;
  };

  const getLanguageFlag = (code: string) => {
    const flags: Record<string, string> = {
      vi: '🇻🇳',
      ja: '🇯🇵',
      en: '🇬🇧'
    };
    return flags[code] || '🌐';
  };

  return (
    <>
      <PageMeta
        title="Translation Test | SmartFactory CONNECT"
        description="Test Gemini API translation between Vietnamese and Japanese"
      />

      <div className="p-4 mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🌐 Translation Test - Gemini API
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Test tính năng dịch thuật Việt - Nhật sử dụng Google Gemini API
          </p>
        </div>

        {/* Main Translation Interface */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLanguageFlag(sourceLang)}</span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="ja">🇯🇵 日本語</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <button
                onClick={handleSwapLanguages}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Đổi ngôn ngữ"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhập văn bản ${getLanguageName(sourceLang)}...`}
              rows={8}
              className="w-full rounded-lg border border-gray-300 p-4 text-base focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {inputText.length} ký tự
              </span>
              <button
                onClick={() => setInputText('')}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Xóa
              </button>
            </div>

            {/* Sample Texts */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Văn bản mẫu:
              </p>
              <div className="space-y-2">
                {sampleTexts[sourceLang as keyof typeof sampleTexts]?.map((text, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseSample(text)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-left text-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{getLanguageFlag(targetLang)}</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <div className="min-h-[200px] rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      Đang dịch...
                    </p>
                  </div>
                </div>
              ) : translatedText ? (
                <div>
                  <p className="text-base text-gray-900 dark:text-white">
                    {translatedText}
                  </p>
                  {translationMethod && (
                    <div className="mt-4 flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {translationMethod}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⚡ {translationTime}ms
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Kết quả dịch sẽ hiển thị ở đây...
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {translatedText && (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {translatedText.length} ký tự
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(translatedText);
                      toast.success('Đã copy vào clipboard!');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Translate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-medium text-white shadow-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang dịch...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Dịch ngay
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">🤖 Powered by Google Gemini 1.5 Flash</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-blue-700 dark:text-blue-300">
                <li>Context-aware translation (hiểu ngữ cảnh nhà máy)</li>
                <li>Technical terminology support (thuật ngữ kỹ thuật)</li>
                <li>Formal business language (ngôn ngữ công việc chuyên nghiệp)</li>
                <li>FREE tier: 15 requests/min, 1,500 requests/day</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
