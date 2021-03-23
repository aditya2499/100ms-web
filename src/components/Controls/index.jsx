import React from 'react';
import { ControlButton } from './ControlButton';
import VideoIcon from 'mdi-react/VideoIcon';
import VideocamOffIcon from 'mdi-react/VideocamOffIcon';
import MicrophoneIcon from 'mdi-react/MicrophoneIcon';
import MicrophoneOffIcon from 'mdi-react/MicrophoneOffIcon';
import PhoneHangupIcon from 'mdi-react/PhoneHangupIcon';
import TelevisionIcon from 'mdi-react/TelevisionIcon';
import TelevisionOffIcon from 'mdi-react/TelevisionOffIcon';
import VideoCheckIcon from 'mdi-react/VideoCheckIcon';
import ToolShare from '../../ToolShare';

const Controls = ({
  isMuted,
  isScreenSharing,
  isCameraOn,
  isChatOpen,
  onScreenToggle,
  onMicToggle,
  onCamToggle,
  onLeave,
  onChatToggle,
  loginInfo,

  //edited
  onRaiseHand,
  onPrivateChatToggle,
  isPrivateChatOpen,
  onPollBoxToggle,
  isPollBoxOpen,
  onPollCreate
}) => {
  return (
    <div
      className="h-16 absolute w-full justify-center bottom-0 flex items-center py-1"
      style={{ backgroundColor: '#1a1619' }}
    >
      <div className="mr-1">
        <ControlButton
          icon={<VideoIcon className="text-indigo-100" />}
          activeIcon={<VideocamOffIcon className="text-red-100" />}
          label="Camera"
          isActive={!isCameraOn}
          onClick={onCamToggle}
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<MicrophoneIcon className="text-indigo-100" />}
          activeIcon={<MicrophoneOffIcon className="text-red-100" />}
          label="Mic"
          isActive={isMuted}
          onClick={onMicToggle}
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<PhoneHangupIcon className="text-red-100" />}
          activeIcon={<PhoneHangupIcon className="text-red-100" />}
          label="Leave"
          onClick={onLeave}
          isActive
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<TelevisionIcon className="text-indigo-100" />}
          activeIcon={<TelevisionOffIcon className="text-red-100" />}
          label="Screen"
          isActive={isScreenSharing}
          onClick={onScreenToggle}
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          activeIcon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          label="Chat"
          onClick={onChatToggle}
          isActive={isChatOpen}
        />
      </div>

      {/* edited */}
      <div className="mx-1">
        <ControlButton
          icon={<TelevisionIcon className="text-indigo-100" />}
          activeIcon={<TelevisionOffIcon className="text-red-100" />}
          label="Raise Hand"
          //isActive={raiseHand}
          onClick={onRaiseHand}
        />
      </div>

      <div className="mx-1">
        <ControlButton
          icon={<TelevisionIcon className="text-indigo-100" />}
          activeIcon={<TelevisionOffIcon className="text-red-100" />}
          label="Poll Create"
          isActive={isPollBoxOpen}
          onClick={onPollBoxToggle}
        />
      </div>

      <div className="mx-1">
        <ControlButton
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          activeIcon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          label="PersonalChat"
          onClick={onPrivateChatToggle}
          isActive={isPrivateChatOpen}
        />
      </div>

      <div className="ml-1">
        <ToolShare loginInfo={loginInfo} />
      </div>
    </div>
  );
};

export { Controls };
