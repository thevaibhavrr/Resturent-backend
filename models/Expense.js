const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseReason: {
        type: String,
        required: [true, 'Expense reason is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
    },
    expenseType: {
        type: String,
        enum: ['cash', 'online'],
        required: [true, 'Expense type is required']
    },
    expenseBy: {
        type: String,
        required: [true, 'Expense by is required'],
        trim: true
    },
    expenseDate: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    category: {
        type: String,
        default: 'Other'
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: false
    },
    restaurantId: {
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    shopName: {
        type: String,
        default: '',
        trim: true
    },
    receipt: {
        type: String, // URL or file path for receipt image
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
