const publicServerError = (error, fallback = 'Server error') => {
  if (process.env.NODE_ENV === 'production') {
    return fallback;
  }
  return error?.message || fallback;
};

module.exports = { publicServerError };
