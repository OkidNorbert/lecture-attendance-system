const adminMiddleware = (req, res, next) => {
    console.log('Checking admin privileges for user:', {
        id: req.user?.id,
        role: req.user?.role
    });

    if (!req.user || req.user.role !== 'admin') {
        console.log('Access denied: User is not admin');
        return res.status(403).json({ 
            msg: "Access denied. Admin privileges required." 
        });
    }

    console.log('Admin access granted');
    next();
};

module.exports = adminMiddleware; 