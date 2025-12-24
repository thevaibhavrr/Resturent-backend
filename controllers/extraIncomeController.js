const ExtraIncome = require('../models/ExtraIncome');

// Create a new extra income entry
exports.createExtraIncome = async (req, res) => {
    try {
        const {
            incomeSource,
            amount,
            incomeType,
            incomeDate,
            description,
            category,
            restaurantId,
            recordedBy,
            paymentReference,
            receipt,
            billImageUrl
        } = req.body;

        const extraIncome = new ExtraIncome({
            incomeSource,
            amount,
            incomeType,
            incomeDate: incomeDate ? new Date(incomeDate) : new Date(),
            description: description || '',
            category: category || 'other',
            restaurantId,
            recordedBy,
            paymentReference: paymentReference || '',
            receipt: receipt || '',
            billImageUrl: billImageUrl || ''
        });

        await extraIncome.save();
        res.status(201).json({ message: 'Extra income recorded successfully', extraIncome });
    } catch (error) {
        console.error('Error creating extra income:', error);
        res.status(500).json({ message: 'Error creating extra income', error: error.message });
    }
};

// Get single extra income by ID
exports.getExtraIncomeById = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.query;

        const extraIncome = await ExtraIncome.findOne({ _id: id, restaurantId });

        if (!extraIncome) {
            return res.status(404).json({ message: 'Extra income not found' });
        }

        res.status(200).json(extraIncome);
    } catch (error) {
        console.error('Error fetching extra income:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid extra income ID' });
        }
        res.status(500).json({ message: 'Error fetching extra income', error: error.message });
    }
};

// Get all extra income entries with optional filtering
exports.getExtraIncomes = async (req, res) => {
    try {
        const { restaurantId, startDate, endDate, minAmount, maxAmount, category } = req.query;

        const query = {};

        if (restaurantId) query.restaurantId = restaurantId;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.incomeDate = {};
            if (startDate) query.incomeDate.$gte = new Date(startDate);
            if (endDate) query.incomeDate.$lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        const extraIncomes = await ExtraIncome.find(query)
            .sort({ incomeDate: -1 });

        res.status(200).json(extraIncomes);
    } catch (error) {
        console.error('Error fetching extra incomes:', error);
        res.status(500).json({ message: 'Error fetching extra incomes', error: error.message });
    }
};

// Get a single extra income entry by ID
exports.getExtraIncomeById = async (req, res) => {
    try {
        const extraIncome = await ExtraIncome.findById(req.params.id);
        if (!extraIncome) {
            return res.status(404).json({ message: 'Extra income entry not found' });
        }
        res.status(200).json(extraIncome);
    } catch (error) {
        console.error('Error fetching extra income:', error);
        res.status(500).json({ message: 'Error fetching extra income', error: error.message });
    }
};

// Update an extra income entry
exports.updateExtraIncome = async (req, res) => {
    try {
        const {
            incomeSource,
            amount,
            incomeType,
            incomeDate,
            description,
            category,
            recordedBy,
            paymentReference,
            receipt,
            billImageUrl
        } = req.body;

        const updateData = {
            incomeSource,
            amount,
            incomeType,
            incomeDate: incomeDate ? new Date(incomeDate) : undefined,
            description: description || '',
            category: category || 'other',
            recordedBy,
            paymentReference: paymentReference || '',
            receipt: receipt || '',
            billImageUrl: billImageUrl || '',
            updatedAt: new Date()
        };

        const extraIncome = await ExtraIncome.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!extraIncome) {
            return res.status(404).json({ message: 'Extra income entry not found' });
        }

        res.status(200).json({ message: 'Extra income updated successfully', extraIncome });
    } catch (error) {
        console.error('Error updating extra income:', error);
        res.status(500).json({ message: 'Error updating extra income', error: error.message });
    }
};

// Delete an extra income entry
exports.deleteExtraIncome = async (req, res) => {
    try {
        const extraIncome = await ExtraIncome.findByIdAndDelete(req.params.id);
        if (!extraIncome) {
            return res.status(404).json({ message: 'Extra income entry not found' });
        }
        res.status(200).json({ message: 'Extra income entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting extra income:', error);
        res.status(500).json({ message: 'Error deleting extra income', error: error.message });
    }
};

// Get extra income summary (total amount by time period)
exports.getExtraIncomeSummary = async (req, res) => {
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
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$incomeDate' } };
                break;
            case 'month':
                groupBy = { $dateToString: { format: '%Y-%m', date: '$incomeDate' } };
                break;
            case 'year':
                groupBy = { $dateToString: { format: '%Y', date: '$incomeDate' } };
                break;
            default:
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$incomeDate' } };
        }

        const summary = await ExtraIncome.aggregate([
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
        console.error('Error fetching extra income summary:', error);
        res.status(500).json({ message: 'Error fetching extra income summary', error: error.message });
    }
};
