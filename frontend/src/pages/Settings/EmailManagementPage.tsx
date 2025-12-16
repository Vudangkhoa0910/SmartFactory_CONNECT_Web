import { useState, useEffect } from 'react';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import emailService, { EmailStatus, EmailRecipient } from '../../services/email.service';

export default function EmailManagementPage() {
    const [status, setStatus] = useState<EmailStatus | null>(null);
    const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('Thông báo từ SmartFactory CONNECT');
    const [message, setMessage] = useState('Đây là email thông báo từ hệ thống SmartFactory CONNECT.');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statusData, recipientsData] = await Promise.all([
                emailService.getStatus(),
                emailService.getRecipients(4) // Get supervisors and above
            ]);

            setStatus(statusData);
            setRecipients(recipientsData.recipients);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu dịch vụ email');
            console.error('Error loading email data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !recipientEmail.includes('@')) {
            setError('Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        try {
            setSending(true);
            setError(null);
            setSuccess(null);

            await emailService.sendTestEmail({
                to_email: recipientEmail,
                subject,
                message
            });

            setSuccess(`Đã gửi email thành công đến ${recipientEmail}!`);
            setRecipientEmail('');

            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi email');
            console.error('Error sending email:', err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <>
            <PageBreadcrumb pageTitle="Quản lý Email" />

            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                            <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Quản Lý Dịch Vụ Email
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Cấu hình và gửi thông báo email qua SendGrid
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
                        <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
                        <div className="flex items-center gap-2 text-success-700 dark:text-success-400">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Service Status Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Trạng Thái Dịch Vụ
                        </h3>

                        {status && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Nhà cung cấp:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{status.provider}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.configuration_status === 'Ready'
                                            ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                                            : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
                                        }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${status.configuration_status === 'Ready' ? 'bg-success-500' : 'bg-error-500'
                                            }`}></span>
                                        {status.configuration_status === 'Ready' ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Thông báo:</span>
                                    <span className={`font-semibold ${status.email_notifications_enabled
                                            ? 'text-success-600'
                                            : 'text-gray-500'
                                        }`}>
                                        {status.email_notifications_enabled ? 'Đã bật' : 'Đã tắt'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Địa chỉ gửi:</span>
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">{status.from_email}</span>
                                </div>

                                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Người nhận mặc định:</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {status.potential_recipients.supervisors_and_above} người
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Email tự động gửi đến Giám sát viên trở lên
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Send Email Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Gửi Email Thủ Công
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Địa chỉ email người nhận
                                </label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tiêu đề
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Tiêu đề email"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nội dung
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Nội dung email"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSendEmail}
                                disabled={sending || !status?.email_notifications_enabled}
                                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? 'Đang gửi...' : 'Gửi Email'}
                            </button>

                            {!status?.email_notifications_enabled && (
                                <p className="text-xs text-warning-600 dark:text-warning-400 text-center">
                                    Thông báo email đã bị tắt trong cấu hình
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recipients List Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Danh Sách Người Nhận Mặc Định
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {recipients.length} người
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Họ tên
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Ngôn ngữ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                                {recipients.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Chưa có người nhận nào được cấu hình
                                        </td>
                                    </tr>
                                ) : (
                                    recipients.map((recipient, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {recipient.full_name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                                                    {recipient.email}
                                                </code>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {recipient.preferred_language === 'vi' ? 'Tiếng Việt' : 'Tiếng Nhật'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Về Thông Báo Email
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="space-y-3 text-gray-600 dark:text-gray-400">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Thông báo tự động:</strong> Email được gửi tự động khi có sự cố hoặc tin tức mới được tạo/công bố đến tất cả giám sát viên và quản lý trong hệ thống.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Hỗ trợ đa ngôn ngữ:</strong> Email được gửi theo ngôn ngữ ưa thích của người dùng (Tiếng Việt hoặc Tiếng Nhật) với giao diện HTML được thiết kế đẹp mắt.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Người nhận:</strong> Mặc định, email được gửi đến người dùng có cấp Giám sát viên trở lên để đảm bảo thông báo quan trọng đến được với người ra quyết định.
                            </p>
                            <p className="text-sm">
                                <strong className="text-gray-900 dark:text-white">Lưu ý:</strong> Email được gửi từ <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">{status?.from_email}</code> là địa chỉ không thể trả lời. Người dùng không nên trả lời email này.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
