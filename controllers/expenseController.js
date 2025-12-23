const Expense = require('../models/Expense');
const Staff = require('../models/Staff');

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const {
            expenseReason,
            amount,
            expenseType,
            expenseBy,
            expenseDate,
            description,
            category,
            staff: staffId,
            restaurantId,
            paymentMethod,
            shopName,
            receipt
        } = req.body;

        // If staff ID is provided, verify it exists
        if (staffId) {
            const staff = await Staff.findById(staffId);
            if (!staff) {
                return res.status(400).json({ message: 'Staff member not found' });
            }
        }

        const expense = new Expense({
            expenseReason,
            amount,
            expenseType: expenseType || 'cash', // Default to 'cash' if not provided
            expenseBy,
            expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
            description: description || '',
            category: category || 'other',
            staff: staffId || null,
            restaurantId,
            paymentMethod: paymentMethod || 'cash',
            shopName: shopName || '',
            receipt: receipt || ''
        });

        await expense.save();
        res.status(201).json({ message: 'Expense created successfully', expense });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Error creating expense', error: error.message });
    }
};

// Get all expenses with optional filtering
// Get single expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.query;

        const expense = await Expense.findOne({ _id: id, restaurantId })
            .populate('staff', 'name position');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid expense ID' });
        }
        res.status(500).json({ message: 'Error fetching expense', error: error.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate, minAmount, maxAmount, category, expenseType } = req.query;

        const query = {};

        if (restaurantId) query.restaurantId = restaurantId;
        if (category) query.category = category;
        if (expenseType) query.expenseType = expenseType;
        if (startDate || endDate) {
            query.expenseDate = {};
            if (startDate) query.expenseDate.$gte = new Date(startDate);
            if (endDate) query.expenseDate.$lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        const expenses = await Expense.find(query)
            .populate('staff', 'name position')
            .sort({ expenseDate: -1 });

        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
};

// Get a single expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id).populate('staff', 'name position');
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ message: 'Error fetching expense', error: error.message });
    }
};

// Update an expense
exports.updateExpense = async (req, res) => {
    try {
        const {
            expenseReason,
            amount,
            expenseType,
            expenseBy,
            expenseDate,
            description,
            category,
            staff: staffId,
            paymentMethod,
            shopName,
            receipt
        } = req.body;

        if (staffId) {
            const staff = await Staff.findById(staffId);
            if (!staff) {
                return res.status(400).json({ message: 'Staff member not found' });
            }
        }

        const updateData = {
            expenseReason,
            amount,
            expenseType: expenseType || 'cash',
            expenseBy,
            expenseDate: expenseDate ? new Date(expenseDate) : undefined,
            description: description || '',
            category: category || 'other',
            staff: staffId || null,
            paymentMethod: paymentMethod || 'cash',
            shopName: shopName || '',
            receipt: receipt || '',
            updatedAt: new Date()
        };

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense updated successfully', expense });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Error updating expense', error: error.message });
    }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
};

// Get expense summary (total amount by time period)
exports.getExpenseSummary = async (req, res) => {
    try {
        const { restaurantId, period = 'day' } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is required' });
        }

        let groupBy;
        const match = { restaurantId };

        // Set the date format based on the period
        switch (period) {
            case 'day':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } };
                break;
            case 'month':
                groupBy = { $dateToString: { format: '%Y-%m', date: '$expenseDate' } };
                break;
            case 'year':
                groupBy = { $dateToString: { format: '%Y', date: '$expenseDate' } };
                break;
            default:
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } };
        }

        const summary = await Expense.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupBy,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching expense summary:', error);
        res.status(500).json({ message: 'Error fetching expense summary', error: error.message });
    }
};
