interface OnboardingStepperProps {
  apiConfigured: boolean;
  hasPreferences: boolean;
  hasDeals: boolean;
  onGoToApi: () => void;
  onGoToPrefs: () => void;
  onRunScan: () => void;
  loading: boolean;
}

export function OnboardingStepper({
  apiConfigured,
  hasPreferences,
  hasDeals,
  onGoToApi,
  onGoToPrefs,
  onRunScan,
  loading,
}: OnboardingStepperProps) {
  const steps = [
    {
      label: '配置 API Key',
      description: '连接 DeepSeek 以启用 AI 评分',
      done: apiConfigured,
      action: onGoToApi,
      actionLabel: '前往配置',
    },
    {
      label: '设置投资偏好',
      description: '告诉 AI 你关注什么赛道和阶段',
      done: hasPreferences,
      action: onGoToPrefs,
      actionLabel: '设置偏好',
    },
    {
      label: '执行首次扫描',
      description: '从 Product Hunt、GitHub 抓取并评分项目',
      done: hasDeals,
      action: onRunScan,
      actionLabel: loading ? '扫描中...' : '开始扫描',
    },
  ];

  const currentStep = steps.findIndex(s => !s.done);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🚀</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">欢迎使用 DealFlow</h2>
        <p className="text-gray-500">完成以下 3 步，开始你的 AI 投资助手之旅</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
              step.done
                ? 'bg-green-50 border-green-200'
                : i === currentStep
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              step.done
                ? 'bg-green-500 text-white'
                : i === currentStep
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-300 text-white'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm">{step.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{step.description}</div>
            </div>
            {i === currentStep && !step.done && (
              <button
                onClick={step.action}
                disabled={loading}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
