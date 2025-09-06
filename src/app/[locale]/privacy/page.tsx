'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiExternalLink } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');
  const locale = useLocale();
  const router = useRouter();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
    { code: 'sk', label: 'Slovenčina' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Language Tabs */}
        <div className="flex justify-center border-b border-muted mb-8">
          {languages.map(lang => (
            <a
              key={lang.code}
              href={`/${lang.code}/privacy`}
              className={`px-6 py-3 font-semibold border-b-2 focus:outline-none ${locale === lang.code ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}
            >
              {lang.label}
            </a>
          ))}
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => router.replace("/")}
            variant="ghost"
            leftIcon={<FiArrowLeft className="w-4 h-4" />}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('back')}
          </Button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('title')}
              </h1>
              <p className="text-lg text-gray-600">
                <strong>{t('lastUpdated')}:</strong> {t('lastUpdatedDate')}
              </p>
            </div>

            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. {t('introduction.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('introduction.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('introduction.paragraph2')}
              </p>
            </div>

            {/* Data Controller */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. {t('dataController.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('dataController.description')}
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-primary">
                <div className="font-semibold text-gray-900 mb-3">Kids Only</div>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4" />
                    <span>Barichgasse 40-42, 1030 Wien, Austria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <a href="mailto:privacy@kidsonly.com" className="text-primary hover:underline">
                      privacy@kidsonly.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('dataController.afterDescription')}
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. {t('informationWeCollect.title')}
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {t('informationWeCollect.personal.title')}:
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>{t('informationWeCollect.personal.name')}</li>
                    <li>{t('informationWeCollect.personal.email')}</li>
                    <li>{t('informationWeCollect.personal.phone')}</li>
                    <li>{t('informationWeCollect.personal.address')}</li>
                    <li>{t('informationWeCollect.personal.dob')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {t('informationWeCollect.children.title')}:
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>{t('informationWeCollect.children.name')}</li>
                    <li>{t('informationWeCollect.children.gender')}</li>
                    <li>{t('informationWeCollect.children.dob')}</li>
                  </ul>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-3">
                    <p className="text-yellow-800 font-medium">
                      {t('informationWeCollect.children.note')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. {t('howWeUse.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('howWeUse.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('howWeUse.purpose1')}</li>
                <li>{t('howWeUse.purpose2')}</li>
                <li>{t('howWeUse.purpose3')}</li>
                <li>{t('howWeUse.purpose4')}</li>
                <li>{t('howWeUse.purpose5')}</li>
                <li>{t('howWeUse.purpose6')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('howWeUse.afterDescription')}
              </p>
            </div>

            {/* Legal Basis */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. {t('legalBasis.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legalBasis.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('legalBasis.consent')}</li>
                <li>{t('legalBasis.contract')}</li>
                <li>{t('legalBasis.legal')}</li>
                <li>{t('legalBasis.legitimate')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legalBasis.childrenNote')}
              </p>
            </div>

            {/* Information Sharing */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. {t('informationSharing.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('informationSharing.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('informationSharing.paragraph2')}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('informationSharing.brevoNote')}
              </p>
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                <p className="text-primary font-medium">
                  {t('informationSharing.partnersNote')}
                </p>
              </div>
            </div>

            {/* International Transfers */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. {t('internationalTransfers.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('internationalTransfers.description')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('internationalTransfers.controllerNote')}
              </p>
            </div>

            {/* Data Retention */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. {t('dataRetention.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('dataRetention.description')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('dataRetention.inactiveNote')}
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. {t('yourRights.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('yourRights.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>{t('yourRights.right1')}</strong> – {t('yourRights.right1Desc')}</li>
                <li><strong>{t('yourRights.right2')}</strong> – {t('yourRights.right2Desc')}</li>
                <li><strong>{t('yourRights.right3')}</strong> – {t('yourRights.right3Desc')}</li>
                <li><strong>{t('yourRights.right4')}</strong></li>
                <li><strong>{t('yourRights.right5')}</strong></li>
                <li><strong>{t('yourRights.right6')}</strong></li>
                <li><strong>{t('yourRights.right7')}</strong></li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('yourRights.contact')} <a href="mailto:privacy@kidsonly.com" className="text-primary hover:underline">privacy@kidsonly.com</a>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('yourRights.brevoRights')}
              </p>
            </div>

            {/* Data Security */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. {t('dataSecurity.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('dataSecurity.description')}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>{t('dataSecurity.measure1')}</li>
                <li>{t('dataSecurity.measure2')}</li>
                <li>{t('dataSecurity.measure3')}</li>
                <li>{t('dataSecurity.measure4')}</li>
                <li>{t('dataSecurity.measure5')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('dataSecurity.breachNote')}
              </p>
            </div>

            {/* Cookies */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. {t('cookies.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('cookies.description')}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. {t('responsibility.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('responsibility.description')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('responsibility.brevoProcessor')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('responsibility.breachResponsibility')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('responsibility.ourLiability')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('responsibility.brevoLiability')}
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. {t('contact.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('contact.description')}
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{t('contact.email')}:</span>
                    <a href="mailto:privacy@kidsonly.com" className="text-primary hover:underline">
                      privacy@kidsonly.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{t('contact.phone')}:</span>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{t('contact.address')}:</span>
                    <span>123 Kids Street, City, Country</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-red-800 mb-2">
                  {t('contact.complaint')}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4" />
                    <span>Barichgasse 40-42, 1030 Wien, Austria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiExternalLink className="w-4 h-4" />
                    <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      www.dsb.gv.at
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. {t('changes.title')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('changes.description')}
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-8 text-center">
              <p className="text-gray-600">
                {t('footer.text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 