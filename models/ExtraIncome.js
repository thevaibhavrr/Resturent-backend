const mongoose = require('mongoose');

const extraIncomeSchema = new mongoose.Schema({
    incomeSource: {
        type: String,
        required: [true, 'Income source is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
    },
    incomeType: {
        type: String,
        enum: ['cash', 'online', 'card', 'bank_transfer'],
        required: [true, 'Income type is required']
    },
    incomeDate: {
        type: Date,
        required: [true, 'Income date is required'],
        default: Date.now
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    category: {
        type: String,
        default: 'other'
    },
    restaurantId: {
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    recordedBy: {
        type: String,
        required: [true, 'Recorded by is required'],
        trim: true
    },
    paymentReference: {
        type: String,
        default: '',
        trim: true
    },
    receipt: {
        type: String, // URL or file path for receipt/proof
        default: ''
    },
    billImageUrl: {
        type: String, // Cloudinary URL for bill image
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExtraIncome', extraIncomeSchema);
