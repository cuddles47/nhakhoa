const Joi = require('joi');

const imageSchemas = {
    create: Joi.object({
        visit_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'ID lần khám phải là số',
                'any.required': 'ID lần khám là bắt buộc'
            }),
        
        url_minio: Joi.string()
            .uri()
            .required()
            .messages({
                'string.uri': 'URL ảnh không hợp lệ',
                'any.required': 'URL ảnh là bắt buộc'
            }),
        
        image_category: Joi.string()
            .valid('raw', 'stained')
            .required()
            .messages({
                'any.only': 'Danh mục ảnh phải là raw hoặc stained',
                'any.required': 'Danh mục ảnh là bắt buộc'
            }),
        
        image_type: Joi.string()
            .valid('frontal', 'lateral_right', 'lateral_left', 'upper_occlusal', 
                   'lower_occlusal', 'smile', 'profile_right', 'profile_left', 'bite')
            .required()
            .messages({
                'any.only': 'Loại ảnh không hợp lệ',
                'any.required': 'Loại ảnh là bắt buộc'
            }),
        
        image_index: Joi.number()
            .integer()
            .min(1)
            .max(18)
            .required()
            .messages({
                'number.min': 'Chỉ số ảnh phải từ 1-18',
                'number.max': 'Chỉ số ảnh phải từ 1-18',
                'any.required': 'Chỉ số ảnh là bắt buộc'
            }),
        
        validation_status: Joi.string()
            .valid('pending', 'valid', 'invalid')
            .default('pending')
            .messages({
                'any.only': 'Trạng thái xác thực phải là: pending, valid hoặc invalid'
            }),
        
        notes: Joi.string()
            .max(500)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 500 ký tự'
            })
    }),

    updateValidation: Joi.object({
        validation_status: Joi.string()
            .valid('pending', 'valid', 'invalid')
            .required()
            .messages({
                'any.only': 'Trạng thái xác thực phải là: pending, valid hoặc invalid',
                'any.required': 'Trạng thái xác thực là bắt buộc'
            }),
        
        notes: Joi.string()
            .max(500)
            .allow('', null)
            .messages({
                'string.max': 'Ghi chú không được vượt quá 500 ký tự'
            })
    })
};

module.exports = imageSchemas;
