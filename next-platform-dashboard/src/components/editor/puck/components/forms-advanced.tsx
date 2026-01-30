/**
 * Puck Advanced Form Components (PHASE-ED-02C)
 * 
 * Advanced form components for user input and data collection.
 * Includes MultiStepForm, Rating, FileUpload, DatePicker, RangeSlider, etc.
 */

import React, { useState, useRef } from "react";
import { DropZone } from "@puckeditor/core";
import type {
  MultiStepFormProps,
  RatingInputProps,
  FileUploadProps,
  DatePickerInputProps,
  RangeSliderProps,
  SwitchInputProps,
  CheckboxGroupProps,
  RadioGroupProps,
  SearchInputProps,
  PasswordInputProps,
  OTPInputProps,
  SelectInputProps,
  TagInputProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";
import {
  Star,
  Heart,
  Circle,
  Upload,
  X,
  Calendar,
  Search,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  Image,
} from "lucide-react";

/**
 * MultiStep Form Component
 * Multi-step wizard form with progress indicator.
 */
export function MultiStepFormRender({
  steps = [
    { id: "step1", title: "Step 1", description: "Basic information" },
    { id: "step2", title: "Step 2", description: "Additional details" },
    { id: "step3", title: "Step 3", description: "Confirmation" },
  ],
  currentStep = 0,
  showProgress = true,
  progressVariant = "steps",
  allowSkip = false,
  submitText = "Submit",
  nextText = "Next",
  prevText = "Previous",
}: MultiStepFormProps) {
  const [activeStep, setActiveStep] = useState(currentStep || 0);
  const totalSteps = (steps || []).length;

  const goNext = () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const goPrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderProgress = () => {
    if (!showProgress) return null;

    switch (progressVariant) {
      case "dots":
        return (
          <div className="flex justify-center gap-2 mb-6">
            {(steps || []).map((_, index) => (
              <button
                key={index}
                onClick={() => allowSkip && setActiveStep(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  index === activeStep
                    ? "bg-primary"
                    : index < activeStep
                      ? "bg-primary/50"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        );

      case "bar":
        return (
          <div className="mb-6">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Step {activeStep + 1} of {totalSteps}
            </p>
          </div>
        );

      case "steps":
      default:
        return (
          <div className="flex items-center justify-center mb-6">
            {(steps || []).map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => allowSkip && setActiveStep(index)}
                  className={cn(
                    "flex flex-col items-center",
                    allowSkip && "cursor-pointer",
                    !allowSkip && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      index === activeStep
                        ? "bg-primary text-primary-foreground"
                        : index < activeStep
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index < activeStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-1 hidden sm:block",
                      index === activeStep
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {index < totalSteps - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      index < activeStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderProgress()}

      {/* Step Content */}
      <div className="min-h-[200px]">
        {(steps || []).map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "transition-opacity duration-300",
              index === activeStep ? "opacity-100" : "hidden opacity-0"
            )}
          >
            <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
            {step.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {step.description}
              </p>
            )}
            <DropZone zone={`step-${step.id}`} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <button
          onClick={goPrev}
          disabled={activeStep === 0}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            activeStep === 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {prevText}
        </button>
        <button
          onClick={activeStep === totalSteps - 1 ? undefined : goNext}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          {activeStep === totalSteps - 1 ? submitText : nextText}
        </button>
      </div>
    </div>
  );
}

/**
 * Rating Input Component
 * Star/heart rating input.
 */
export function RatingInputRender({
  name,
  label,
  maxRating = 5,
  defaultValue = 0,
  size = "md",
  icon = "star",
  color,
  allowHalf = false,
  readonly = false,
  showValue = false,
}: RatingInputProps) {
  const [rating, setRating] = useState(defaultValue || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const IconComponent = icon === "star" ? Star : icon === "heart" ? Heart : Circle;

  const sizeClasses: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (value: number) => {
    if (!readonly) {
      setRating(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating || 5 }).map((_, index) => {
          const value = index + 1;
          const isFilled = value <= displayRating;
          const isHalf = allowHalf && value - 0.5 === displayRating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => !readonly && setHoverRating(value)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              className={cn(
                "transition-transform",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
            >
              <IconComponent
                className={cn(
                  sizeClasses[size || "md"],
                  "transition-colors",
                  isFilled || isHalf
                    ? "fill-current"
                    : "fill-transparent stroke-muted-foreground"
                )}
                style={{
                  color: isFilled || isHalf ? (color || "#facc15") : undefined,
                }}
              />
            </button>
          );
        })}
        {showValue && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} / {maxRating}
          </span>
        )}
      </div>
      <input type="hidden" name={name} value={rating} />
    </div>
  );
}

/**
 * File Upload Component
 * File/image upload with drag and drop.
 */
export function FileUploadRender({
  name,
  label,
  accept = "image/*",
  multiple = false,
  maxSize = 5,
  maxFiles = 5,
  variant = "dropzone",
  showPreview = true,
  helpText,
  required = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles = Array.from(newFiles).filter((file) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) return false;
      return true;
    });

    if (multiple) {
      setFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles || 5));
    } else {
      setFiles(validFiles.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (variant === "button") {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Choose File{multiple ? "s" : ""}
        </button>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {helpText && (
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        )}
        {showPreview && files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
              >
                {file.name}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
        >
          {files[0] ? (
            <img
              src={URL.createObjectURL(files[0])}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept || "image/*"}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {helpText && (
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        )}
      </div>
    );
  }

  // Dropzone variant (default)
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary"
        )}
      >
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {accept?.replace(/\*/g, "all")} • Max {maxSize}MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
      {showPreview && files.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full aspect-square object-cover rounded"
                />
              ) : (
                <div className="w-full aspect-square bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Date Picker Input Component
 * Date selection with calendar.
 */
export function DatePickerInputRender({
  name,
  label,
  placeholder = "Select date",
  format = "YYYY-MM-DD",
  minDate,
  maxDate,
  showTime = false,
  required = false,
  helpText,
}: DatePickerInputProps) {
  const [value, setValue] = useState("");

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showTime ? "datetime-local" : "date"}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={minDate}
          max={maxDate}
          required={required}
          className="w-full px-4 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={placeholder}
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Range Slider Component
 * Numeric range slider input.
 */
export function RangeSliderRender({
  name,
  label,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  showValue = true,
  showMinMax = true,
  unit,
  marks,
}: RangeSliderProps) {
  const [value, setValue] = useState(defaultValue || 50);

  const percentage = ((value - (min || 0)) / ((max || 100) - (min || 0))) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">{label}</label>
          {showValue && (
            <span className="text-sm text-muted-foreground">
              {value}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className="relative pt-1">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%)`,
          }}
        />
        {showMinMax && (
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {min}
              {unit}
            </span>
            <span>
              {max}
              {unit}
            </span>
          </div>
        )}
        {marks && marks.length > 0 && (
          <div className="relative h-4 mt-1">
            {marks.map((mark) => {
              const markPercentage =
                ((mark.value - (min || 0)) / ((max || 100) - (min || 0))) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute text-xs text-muted-foreground"
                  style={{
                    left: `${markPercentage}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {mark.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Switch Input Component
 * Toggle switch input.
 */
export function SwitchInputRender({
  name,
  label,
  description,
  defaultChecked = false,
  size = "md",
  labelPosition = "right",
  required = false,
}: SwitchInputProps) {
  const [checked, setChecked] = useState(defaultChecked || false);

  const sizeClasses: Record<string, { track: string; thumb: string }> = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3" },
    md: { track: "w-11 h-6", thumb: "w-5 h-5" },
    lg: { track: "w-14 h-7", thumb: "w-6 h-6" },
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => setChecked(!checked)}
      className={cn(
        "relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        checked ? "bg-primary" : "bg-muted",
        sizeClasses[size || "md"].track
      )}
    >
      <span
        className={cn(
          "pointer-events-none rounded-full bg-background shadow-lg transition-transform",
          sizeClasses[size || "md"].thumb,
          checked
            ? size === "sm"
              ? "translate-x-4"
              : size === "lg"
                ? "translate-x-7"
                : "translate-x-5"
            : "translate-x-0.5"
        )}
      />
    </button>
  );

  return (
    <div className="w-full">
      <label
        className={cn(
          "flex items-center gap-3",
          labelPosition === "left" && "flex-row-reverse justify-end"
        )}
      >
        {switchElement}
        {(label || description) && (
          <div>
            {label && (
              <span className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </label>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
    </div>
  );
}

/**
 * Checkbox Group Component
 * Multiple checkbox selection.
 */
export function CheckboxGroupRender({
  name,
  label,
  options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ],
  defaultValue = [],
  orientation = "vertical",
  required = false,
  helpText,
}: CheckboxGroupProps) {
  const [selected, setSelected] = useState<string[]>(defaultValue || []);

  const toggleOption = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {(options || []).map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start gap-2 cursor-pointer",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => !option.disabled && toggleOption(option.value)}
              disabled={option.disabled}
              className="mt-0.5 w-4 h-4 rounded border-input accent-primary"
            />
            <div>
              <span className="text-sm">{option.label}</span>
              {option.description && (
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Radio Group Component
 * Single selection radio buttons.
 */
export function RadioGroupRender({
  name,
  label,
  options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ],
  defaultValue,
  orientation = "vertical",
  variant = "default",
  required = false,
  helpText,
}: RadioGroupProps) {
  const [selected, setSelected] = useState<string>(defaultValue || "");

  if (variant === "cards") {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            "grid gap-3",
            orientation === "vertical" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
          )}
        >
          {(options || []).map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                selected === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected === option.value}
                onChange={() => !option.disabled && setSelected(option.value)}
                disabled={option.disabled}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
        {helpText && (
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        )}
      </div>
    );
  }

  if (variant === "buttons") {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          {(options || []).map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !option.disabled && setSelected(option.value)}
              disabled={option.disabled}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                selected === option.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                index > 0 && "border-l border-border",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name={name} value={selected} />
        {helpText && (
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {(options || []).map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start gap-2 cursor-pointer",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected === option.value}
              onChange={() => !option.disabled && setSelected(option.value)}
              disabled={option.disabled}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <div>
              <span className="text-sm">{option.label}</span>
              {option.description && (
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Search Input Component
 * Search input with icon.
 */
export function SearchInputRender({
  name,
  placeholder = "Search...",
  size = "md",
  variant = "default",
  showClearButton = true,
  showSearchIcon = true,
  iconPosition = "left",
}: SearchInputProps) {
  const [value, setValue] = useState("");

  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-5 py-3 text-lg",
  };

  const variantClasses: Record<string, string> = {
    default: "border border-input bg-background",
    filled: "bg-muted border-transparent",
    outline: "border-2 border-input bg-transparent",
  };

  return (
    <div className="relative w-full">
      {showSearchIcon && iconPosition === "left" && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      <input
        type="search"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md focus:outline-none focus:ring-2 focus:ring-ring",
          sizeClasses[size || "md"],
          variantClasses[variant || "default"],
          showSearchIcon && iconPosition === "left" && "pl-10",
          showSearchIcon && iconPosition === "right" && "pr-10",
          showClearButton && value && "pr-10"
        )}
      />
      {showSearchIcon && iconPosition === "right" && (
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      {showClearButton && value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Password Input Component
 * Password input with visibility toggle.
 */
export function PasswordInputRender({
  name,
  label,
  placeholder = "Enter password",
  showToggle = true,
  showStrength = false,
  required = false,
  helpText,
  minLength = 8,
}: PasswordInputProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  const getStrength = () => {
    if (!value) return 0;
    let strength = 0;
    if (value.length >= (minLength || 8)) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;
    return strength;
  };

  const strength = getStrength();
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full px-4 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {showStrength && value && (
        <div className="mt-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  index < strength
                    ? strengthColors[strength - 1]
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Strength: {strengthLabels[strength - 1] || "Very Weak"}
          </p>
        </div>
      )}
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}

/**
 * OTP Input Component
 * One-time password input boxes.
 */
export function OTPInputRender({
  name,
  label,
  length = 6,
  variant = "boxes",
  autoFocus = true,
  helpText,
  type = "number",
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length || 6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, inputValue: string) => {
    const sanitized = type === "number" ? inputValue.replace(/\D/g, "") : inputValue;
    const char = sanitized.slice(-1);

    const newValues = [...values];
    newValues[index] = char;
    setValues(newValues);

    // Move to next input
    if (char && index < (length || 6) - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const sanitized = type === "number" ? pasted.replace(/\D/g, "") : pasted;
    const chars = sanitized.slice(0, length || 6).split("");

    const newValues = [...values];
    chars.forEach((char, index) => {
      if (index < (length || 6)) {
        newValues[index] = char;
      }
    });
    setValues(newValues);

    // Focus last filled or next empty
    const focusIndex = Math.min(chars.length, (length || 6) - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div className="flex gap-2 justify-center">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type={type === "number" ? "text" : "text"}
            inputMode={type === "number" ? "numeric" : "text"}
            pattern={type === "number" ? "[0-9]*" : undefined}
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            autoFocus={autoFocus && index === 0}
            className={cn(
              "w-12 h-14 text-center text-xl font-semibold bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
              variant === "boxes"
                ? "border border-input rounded-md"
                : "border-b-2 border-input rounded-none"
            )}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={values.join("")} />
      {helpText && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {helpText}
        </p>
      )}
    </div>
  );
}

/**
 * Select Input Component
 * Dropdown select with search and groups.
 */
export function SelectInputRender({
  name,
  label,
  options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ],
  placeholder = "Select an option",
  multiple = false,
  searchable = false,
  clearable = true,
  required = false,
  helpText,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filteredOptions = searchable
    ? (options || []).filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options || [];

  const handleSelect = (value: string) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else {
      setSelected([value]);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      return (options || []).find((o) => o.value === selected[0])?.label;
    }
    return `${selected.length} selected`;
  };

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 text-left border border-input rounded-md bg-background flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
      >
        <span className={cn(selected.length === 0 && "text-muted-foreground")}>
          {getDisplayValue()}
        </span>
        <div className="flex items-center gap-1">
          {clearable && selected.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected([]);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
          {searchable && (
            <div className="p-2 border-b">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center justify-between",
                  selected.includes(option.value) && "bg-primary/10",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {option.label}
                {selected.includes(option.value) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">
                No options found
              </p>
            )}
          </div>
        </div>
      )}

      <input
        type="hidden"
        name={name}
        value={multiple ? selected.join(",") : selected[0] || ""}
      />
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Tag Input Component
 * Input for adding multiple tags.
 */
export function TagInputRender({
  name,
  label,
  placeholder = "Add a tag...",
  defaultTags = [],
  maxTags = 10,
  allowDuplicates = false,
  suggestions = [],
  required = false,
  helpText,
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultTags || []);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!allowDuplicates && tags.includes(trimmed)) return;
    if (tags.length >= (maxTags || 10)) return;

    setTags((prev) => [...prev, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const filteredSuggestions = (suggestions || []).filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      (allowDuplicates || !tags.includes(s))
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="min-h-[42px] px-3 py-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring flex flex-wrap items-center gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
            disabled={tags.length >= (maxTags || 10)}
          />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={tags.join(",")} />
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}
