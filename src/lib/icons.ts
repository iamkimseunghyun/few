// 자주 사용하는 아이콘만 선택적으로 import
// tree-shaking을 통해 사용하지 않는 아이콘은 번들에서 제외됨

export {
  // Navigation
  HomeIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon as SearchIcon,
  PlusIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  
  // Actions
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CameraIcon,
  ArrowUpTrayIcon as UploadIcon,
  ArrowDownTrayIcon as DownloadIcon,
  
  // Status
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  
  // Rating
  StarIcon,
  
  // UI
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  
  // Social
  ChatBubbleLeftIcon,
  BellIcon,
  
  // Location
  MapPinIcon,
  
  // Time
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

// 대체 아이콘 라이브러리가 필요한 경우를 위한 타입 정의
export type IconProps = {
  className?: string;
  onClick?: () => void;
};