const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Title is required'] 
    },
    description: { 
        type: String,
        default: ''
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number']
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
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
