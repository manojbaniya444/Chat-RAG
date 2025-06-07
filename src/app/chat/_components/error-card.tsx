import React from "react";

type Props = {
  message: string;
};

const ErrorCard = ({ message }: Props) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-6">
      <div className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <svg
          className="w-6 h-6 text-red-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
          />
        </svg>
        <span>
          {message || "An error occurred while fetching messages."}
        </span>
      </div>
    </div>
  );
};

export default ErrorCard;
