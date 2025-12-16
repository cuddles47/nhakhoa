const Joi = require('joi');

const patientSchemas = {
    create: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Tên bệnh nhân không được để trống',
                'string.min': 'Tên phải có ít nhất 2 ký tự',
                'string.max': 'Tên không được vượt quá 100 ký tự',
                'any.required': 'Tên bệnh nhân là bắt buộc'
            }),
        
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .required()
            .messages({
                'string.empty': 'Số điện thoại không được để trống',
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
                'any.required': 'Số điện thoại là bắt buộc'
            }),
        
        dob: Joi.date()
            .max('now')
            .iso()
            .messages({
                'date.max': 'Ngày sinh không được là ngày tương lai',
                'date.format': 'Ngày sinh phải có định dạng YYYY-MM-DD'
            }),
        
        gender: Joi.string()
            .valid('male', 'female', 'other')
            .messages({
                'any.only': 'Giới tính phải là male, female hoặc other'
            }),
        
        notes: Joi.string()
            .max(1000)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 1000 ký tự'
            })
    }),

    update: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .messages({
                'string.min': 'Tên phải có ít nhất 2 ký tự',
                'string.max': 'Tên không được vượt quá 100 ký tự'
            }),
        
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
            }),
        
        dob: Joi.date()
            .max('now')
            .iso()
            .messages({
                'date.max': 'Ngày sinh không được là ngày tương lai'
            }),
        
        gender: Joi.string()
            .valid('male', 'female', 'other')
            .messages({
                'any.only': 'Giới tính phải là male, female hoặc other'
            }),
        
        notes: Joi.string()
            .max(1000)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 1000 ký tự'
            })
    }).min(1) // At least one field must be provided for update
};

module.exports = patientSchemas;
