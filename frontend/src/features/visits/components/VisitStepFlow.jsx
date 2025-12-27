import { useState } from 'react';
import Button from '../../../components/ui/Button';
import './VisitStepFlow.css';

/**
 * VisitStepFlow Component
 * Multi-step wizard for visit workflow
 * Steps: Upload → Validate → Process → Label → Complete
 */
const VisitStepFlow = ({ visitId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, label: 'Tải ảnh lên', description: 'Upload ảnh thô và nhuộm' },
    { id: 2, label: 'Kiểm tra', description: 'Validate chất lượng ảnh' },
    { id: 3, label: 'Xử lý', description: 'Process và phân tích' },
    { id: 4, label: 'Gắn nhãn', description: 'Label và chú thích' },
    { id: 5, label: 'Hoàn thành', description: 'Xác nhận và lưu' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId) => {
    // Allow navigation to completed or current steps only
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Bước 1: Tải ảnh lên</h3>
            <p>Tải lên 9 ảnh thô và 9 ảnh nhuộm theo vị trí 3×3 grid.</p>
            <div className="step-placeholder">
              {/* ImageUploader component would go here */}
              <div className="placeholder-box">
                <p>🖼️ ImageUploader Component</p>
                <p className="placeholder-text">Kéo thả hoặc chọn ảnh để tải lên</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3>Bước 2: Kiểm tra ảnh</h3>
            <p>Kiểm tra chất lượng và đánh dấu ảnh hợp lệ/không hợp lệ.</p>
            <div className="step-placeholder">
              <div className="placeholder-box">
                <p>✓ Validation Interface</p>
                <p className="placeholder-text">Review và validate từng ảnh</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3>Bước 3: Xử lý ảnh</h3>
            <p>Hệ thống sẽ tự động xử lý và phân tích ảnh.</p>
            <div className="step-placeholder">
              <div className="placeholder-box">
                <p>⚙️ Processing</p>
                <p className="placeholder-text">Đang xử lý ảnh...</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h3>Bước 4: Gắn nhãn</h3>
            <p>Thêm nhãn và chú thích cho các vùng quan trọng.</p>
            <div className="step-placeholder">
              <div className="placeholder-box">
                <p>🏷️ Labeling Interface</p>
                <p className="placeholder-text">Gắn nhãn và chú thích</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h3>Bước 5: Hoàn thành</h3>
            <p>Xem lại và xác nhận hoàn thành lượt khám.</p>
            <div className="step-placeholder">
              <div className="placeholder-box">
                <p>✅ Review & Complete</p>
                <p className="placeholder-text">Xác nhận và lưu kết quả</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visit-step-flow">
      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div key={step.id} className="step-wrapper">
            <div
              className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''} ${currentStep < step.id ? 'disabled' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="step-number">
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div className="step-info">
                <div className="step-label">{step.label}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content-container">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="step-navigation">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          ← Quay lại
        </Button>

        <div className="step-progress">
          Bước {currentStep} / {steps.length}
        </div>

        {currentStep < steps.length ? (
          <Button
            variant="primary"
            onClick={handleNext}
          >
            Tiếp theo →
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleNext}
          >
            Hoàn thành ✓
          </Button>
        )}
      </div>
    </div>
  );
};

export default VisitStepFlow;
