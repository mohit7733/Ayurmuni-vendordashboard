// DoctorReviews.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Star,
  StarHalf,
  MessageCircle,
  ThumbsUp,
  Calendar,
  User,
  Mail,
  Phone,
  Image,
  Reply,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  Award,
  TrendingUp,
  Users,
  Eye,
  Share2,
  MoreVertical,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { reviewService } from '../../../services/reviewService';
import { Link } from 'react-router-dom';

// Memoized Stats Cards Component
const StatsCards = memo(({ stats, reviews }) => {
  const renderStars = useCallback((rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} className="fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={16} className="fill-yellow-400 text-yellow-400" />);
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />);
    }
    return stars;
  }, []);


// Raman

 const responseRate = stats.total_reviews > 0
  ? Math.round((stats.replied_reviews / stats.total_reviews) * 100)
  : 0;

const unansweredCount =stats.total_reviews - stats.replied_reviews;
// Raman

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</span>
              <div className="flex">{renderStars(stats.average_rating)}</div>

            </div>
          </div>
          <div className="bg-amber-100 p-3 rounded-full">
            <Award size={24} className="text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_reviews}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <MessageSquare size={24} className="text-blue-600" />
          </div>
        </div>
        {stats.recent_trend !== 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {stats.recent_trend > 0 ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingUp size={14} className="text-red-500 rotate-180" />
            )}
            <span className={stats.recent_trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(stats.recent_trend)}% this month
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Response Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{responseRate}%</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <Reply size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Unanswered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{unansweredCount}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle size={24} className="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Memoized Review Card Component
const ReviewCard = memo(({
  review,
  expandedReviews,
  toggleExpand,
  setSelectedReview,
  setReplyText,
  setShowReplyModal,
  setEditingReply,
  handleDeleteReply,
  renderStars
}) => {
  const isExpanded = expandedReviews.has(review.id);
  const hasReply = !!review.doctor_reply;

  const getStatusBadge = useCallback((status, hasReply) => {
    if (status === 'active') {
      return hasReply ? (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle size={12} /> Replied
        </span>
      ) : (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          <AlertCircle size={12} /> Needs Reply
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        <XCircle size={12} /> Archived
      </span>
    );
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] text-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {review.reviewer_profile_image ? (
              <img
                src={review.reviewer_profile_image}
                alt={review.reviewer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/doctor/patients/patient/${review.patient_id}`}
                // className="group inline-flex items-center gap-2 px-4 py-1 rounded-xl bg-[#0D614E]  !text-white text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                {/* <Eye size={16} className="transition-transform duration-300 group-hover:rotate-12" /> */}
                <span className="font-semibold text-gray-900">{review.reviewer_name}</span>
              </Link>

              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(parseISO(review.created_at), { addSuffix: true })}
              </span>
              {getStatusBadge(review.status, hasReply)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(review.rating)}
              <span className="text-xs font-medium text-gray-700 ml-1">{review.rating}.0</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {!hasReply && review.status === 'active' && (
            <button
              onClick={() => {
                setSelectedReview(review);
                setReplyText('');
                setShowReplyModal(true);
              }}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Reply to review"
            >
              <Reply size={16} />
            </button>
          )}
          <button
            onClick={() => toggleExpand(review.id)}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Review Content */}
      {/* Raman */}
{isExpanded && ( <div className="space-y-2">
{/* Review Text */} <p className="text-gray-700 text-sm">
{review.review || 'No written review provided.'} </p>
    {/* Review Images */}
    {review.image_urls?.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {review.image_urls.map((url, idx) => (
                <div
                    key={idx}
                    className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200"
                >
                    <img
                        src={url}
                        alt={`Review ${idx + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
        </div>
    )}

    {/* Doctor's Reply */}
    {hasReply && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-start gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-full flex-shrink-0">
                    <Reply size={12} className="text-emerald-600" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700">
                            Your Reply
                        </span>

                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">
                                {review.doctor_reply_at
                                    ? formatDistanceToNow(
                                          parseISO(review.doctor_reply_at),
                                          { addSuffix: true }
                                      )
                                    : ''}
                            </span>

                            <button
                                onClick={() => {
                                    setSelectedReview(review);
                                    setReplyText(review.doctor_reply);
                                    setEditingReply(review.id);
                                    setShowReplyModal(true);
                                }}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded transition"
                                title="Edit reply"
                            >
                                <Edit2 size={12} />
                            </button>

                            <button
                                onClick={() => handleDeleteReply(review.id)}
                                className="p-1 text-red-400 hover:bg-red-50 rounded transition"
                                title="Delete reply"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                        {review.doctor_reply}
                    </p>
                </div>
            </div>
        </div>
    )}

    {/* Reply Button */}
    {!hasReply && review.status === 'active' && (
        <button
            onClick={() => {
                setSelectedReview(review);
                setReplyText('');
                setEditingReply(null);
                setShowReplyModal(true);
            }}
            className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
        >
            <MessageCircle size={14} />
            Reply to this review
        </button>
    )}
</div>
)}
{/* Raman */}
    </div>
  );
});

// Memoized Reply Modal Component
const ReplyModal = memo(({
  showReplyModal,
  selectedReview,
  replyText,
  setReplyText,
  editingReply,
  setShowReplyModal,
  setEditingReply,
  handleSubmitReply,
  handleUpdateReply,
  renderStars
}) => {
  if (!showReplyModal) return null;

  const isEditing = !!editingReply;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Edit Reply' : 'Reply to Review'}
          </h3>
          <button
            onClick={() => {
              setShowReplyModal(false);
              setReplyText('');
              setEditingReply(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Review Preview */}
          {selectedReview && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm text-gray-700">{selectedReview.reviewer_name}</span>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex">{renderStars(selectedReview.rating)}</div>
              </div>
              <p className="text-sm text-gray-600">{selectedReview.review}</p>
            </div>
          )}

          {/* Reply Textarea - FIXED: Using value instead of defaultValue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Reply <span className="text-red-500">*</span>
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows="4"
              maxLength="1000"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">Max 1000 characters</span>
              <span className="text-xs text-gray-400">{replyText.length}/1000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowReplyModal(false);
                setReplyText('');
                setEditingReply(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isEditing) {
                  handleUpdateReply(selectedReview.id);
                } else {
                  handleSubmitReply(selectedReview.id);
                }
              }}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {isEditing ? 'Update Reply' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Main Component
const DoctorReviews = () => {
  // State Management
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: {},
    recent_trend: 0
  });

  // Filter & Search State
  const [filters, setFilters] = useState({
    status: 'active',
    rating: 'all',
    dateRange: 'all',
    searchQuery: ''
  });

  // UI State
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Render Stars - Memoized
  const renderStars = useCallback((rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} className="fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={16} className="fill-yellow-400 text-yellow-400" />);
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />);
    }
    return stars;
  }, []);

  // Fetch Reviews
  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await reviewService.getDoctorReviews({
        status: filters.status,
        page,
        limit: pagination.itemsPerPage,
        sort: sortBy,
        search: filters.searchQuery,
        rating: filters.rating !== 'all' ? parseInt(filters.rating) : undefined
      });

      if (response?.success) {
        setReviews(response.data || []);
        setStats({
          average_rating: response.average_rating || 0,
          total_reviews: response.total_reviews || 0,
          replied_reviews: response.replied_reviews || 0,
          rating_distribution: response.rating_distribution || {},
          recent_trend: response.recent_trend || 0
        });
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil((response.total_reviews || 0) / prev.itemsPerPage),
          totalItems: response.total_reviews || 0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.status, filters.rating, filters.searchQuery, sortBy, pagination.itemsPerPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Reply Submission
  const handleSubmitReply = useCallback(async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const response = await reviewService.replyToReview(reviewId, { reply: replyText });
      if (response?.success) {
        toast.success('Reply submitted successfully');
        setShowReplyModal(false);
        setReplyText('');
        await fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit reply');
    }
  }, [replyText, fetchReviews, pagination.currentPage]);

  // Handle Reply Update
  const handleUpdateReply = useCallback(async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const response = await reviewService.updateReply(reviewId, { reply: replyText });
      if (response?.success) {
        toast.success('Reply updated successfully');
        setShowReplyModal(false);
        setReplyText('');
        setEditingReply(null);
        await fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update reply');
    }
  }, [replyText, fetchReviews, pagination.currentPage]);

  // Handle Reply Deletion
  const handleDeleteReply = useCallback(async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      const response = await reviewService.deleteReply(reviewId);
      if (response?.success) {
        toast.success('Reply deleted successfully');
        await fetchReviews(pagination.currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete reply');
    }
  }, [fetchReviews, pagination.currentPage]);

  // Toggle Review Expansion
  const toggleExpand = useCallback((reviewId) => {
    setExpandedReviews(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(reviewId)) {
        newExpanded.delete(reviewId);
      } else {
        newExpanded.add(reviewId);
      }
      return newExpanded;
    });
  }, []);

  // Filter Options
  const filterOptions = useMemo(() => ({
    status: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
      { value: 'all', label: 'All' }
    ],
    rating: [
      { value: 'all', label: 'All Ratings' },
      { value: '5', label: '★★★★★ (5)' },
      { value: '4', label: '★★★★☆ (4)' },
      { value: '3', label: '★★★☆☆ (3)' },
      { value: '2', label: '★★☆☆☆ (2)' },
      { value: '1', label: '★☆☆☆☆ (1)' }
    ],
    dateRange: [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'quarter', label: 'This Quarter' }
    ],
    sortBy: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'highest', label: 'Highest Rating' },
      { value: 'lowest', label: 'Lowest Rating' },
      { value: 'most_recent_reply', label: 'Latest Reply' }
    ]
  }), []);

  // Loading Skeleton
  const SkeletonLoader = useMemo(() => () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  ), []);

  // Clear Filters
  const clearFilters = useCallback(() => {
    setFilters({ status: 'active', rating: 'all', dateRange: 'all', searchQuery: '' });
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Reply Modal */}
      <ReplyModal
        showReplyModal={showReplyModal}
        selectedReview={selectedReview}
        replyText={replyText}
        setReplyText={setReplyText}
        editingReply={editingReply}
        setShowReplyModal={setShowReplyModal}
        setEditingReply={setEditingReply}
        handleSubmitReply={handleSubmitReply}
        handleUpdateReply={handleUpdateReply}
        renderStars={renderStars}
      />

      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reviews & Feedback</h1>
            <p className="text-gray-600 mt-1">Manage and respond to patient reviews</p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchReviews(pagination.currentPage);
            }}
            disabled={refreshing}
            className="mt-3 md:mt-0 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} reviews={reviews} />

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            {/* <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {filterOptions.status.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select> */}

            {/* Rating Filter */}
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {filterOptions.rating.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Sort By */}
            {/* <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {filterOptions.sortBy.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select> */}

            {/* View Mode Toggle */}
            {/* <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-3 py-1 rounded-md text-sm transition ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-3 py-1 rounded-md text-sm transition ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                List
              </button>
            </div> */}
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.status !== 'active' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                Status: {filters.status}
                <button onClick={() => setFilters({ ...filters, status: 'active' })} className="hover:text-red-500">
                  <XCircle size={12} />
                </button>
              </span>
            )}
            {filters.rating !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                Rating: {filters.rating}★
                <button onClick={() => setFilters({ ...filters, rating: 'all' })} className="hover:text-red-500">
                  <XCircle size={12} />
                </button>
              </span>
            )}
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                Search: {filters.searchQuery}
                <button onClick={() => setFilters({ ...filters, searchQuery: '' })} className="hover:text-red-500">
                  <XCircle size={12} />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Reviews Grid/List */}
        {loading ? (
          <SkeletonLoader />
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 max-w-md">
                {filters.searchQuery || filters.status !== 'active' || filters.rating !== 'all'
                  ? 'No reviews match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t received any reviews yet. Keep providing excellent care!'}
              </p>
              {(filters.searchQuery || filters.status !== 'active' || filters.rating !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                expandedReviews={expandedReviews}
                toggleExpand={toggleExpand}
                setSelectedReview={setSelectedReview}
                setReplyText={setReplyText}
                setShowReplyModal={setShowReplyModal}
                setEditingReply={setEditingReply}
                handleDeleteReply={handleDeleteReply}
                renderStars={renderStars}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} -{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} reviews
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReviews(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => fetchReviews(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default DoctorReviews;