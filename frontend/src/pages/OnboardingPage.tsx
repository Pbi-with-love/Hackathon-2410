import { Link } from 'react-router-dom';
import ProfileExtractor from '../components/ProfileExtractor';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
          <p className="text-gray-600">
            Type a few lines and we'll build your profile automatically
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <ProfileExtractor />
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/map/teams"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}
