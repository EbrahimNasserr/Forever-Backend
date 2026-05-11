import validator from "validator";

const validateDashboardRange = (range) => {
    const allowedRanges = ["7d", "30d", "12m"];
    if (!allowedRanges.includes(range)) {
        return {
            isValid: false,
            message: `Range must be one of: ${allowedRanges.join(", ")}`
        };
    }
    return { isValid: true };
};

export { validateDashboardRange };