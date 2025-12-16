const Joi = require('joi');

const visitSchemas = {
    create: Joi.object({
        patient_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'ID bệnh nhân phải là số',
                'number.positive': 'ID bệnh nhân phải là số dương',
                'any.required': 'ID bệnh nhân là bắt buộc'
            }),
        
        case_id: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .messages({
                'number.base': 'ID ca điều trị phải là số',
                'number.positive': 'ID ca điều trị phải là số dương'
            }),
        
        visit_date: Joi.date()
            .iso()
            .required()
            .messages({
                'date.base': 'Ngày khám không hợp lệ',
                'date.format': 'Ngày khám phải có định dạng YYYY-MM-DD',
                'any.required': 'Ngày khám là bắt buộc'
            }),
        
        status: Joi.string()
            .valid('pending', 'in_progress', 'completed', 'cancelled')
            .default('pending')
            .messages({
                'any.only': 'Trạng thái phải là: pending, in_progress, completed hoặc cancelled'
            }),
        
        notes: Joi.string()
            .max(2000)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 2000 ký tự'
            }),
        
        created_by: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'ID người tạo phải là số',
                'any.required': 'ID người tạo là bắt buộc'
            })
    }),

    update: Joi.object({
        visit_date: Joi.date()
            .iso()
            .messages({
                'date.format': 'Ngày khám phải có định dạng YYYY-MM-DD'
            }),
        
        status: Joi.string()
            .valid('pending', 'in_progress', 'completed', 'cancelled')
            .messages({
                'any.only': 'Trạng thái phải là: pending, in_progress, completed hoặc cancelled'
            }),
        
        notes: Joi.string()
            .max(2000)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 2000 ký tự'
            })
    }).min(1)
};

module.exports = visitSchemas;
