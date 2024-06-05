const asyncHandler = require("express-async-handler");
const Agreement = require("../models").Agreement;
const Service = require("../models").Service;
const AgreementServices = require("../models").AgreementServices;
const { Op } = require("sequelize");

//@desc     Create a ingredient
//@route    POST /api/ingredients
//@access   Private/ingredient

exports.createAgreement = asyncHandler(async (req, res) => {
    const { name, userId, selectedServices } = req.body;

    try {
        // Crear el acuerdo
        const createdAgreement = await Agreement.create({
            name,
            userId: req.user.id, // Opcional: puedes usar el userId del token de autenticación
        });

        // Si hay servicios seleccionados, realizar la asociación en la tabla intermedia
        if (selectedServices && selectedServices.length > 0) {
            // Buscar los servicios seleccionados en la base de datos
            const services = await Service.findAll({
                where: {
                    id: {
                        [Op.in]: selectedServices // Buscar por IDs de servicios seleccionados
                    }
                }
            });
        
            // Construir instancias de modelos Service a partir de los datos encontrados
            const serviceInstances = services.map(serviceData => Service.build(serviceData));
        
            // Asociar los servicios encontrados con el acuerdo creado en la tabla intermedia
            await createdAgreement.addServices(serviceInstances);
        }

        res.status(201).json(createdAgreement);
    } catch (error) {
        console.error('Error al crear el acuerdo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//@desc     Get all ingredients
//@route    GET /api/ingredients
//@access   Private/user
exports.getAgreements = asyncHandler(async (req, res) => {
    const pageSize = 5;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword ? req.query.keyword : null;
    let options = {};

    if (keyword) {
        options = {
            ...options,
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%${keyword}%` } },
                    { name: { [Op.like]: `%${keyword}%` } },
                ],
            },
        };
    }
    const count = await Agreement.count({ ...options });
    const agreements = await Agreement.findAll({ ...options });

    res.json({ agreements, page, pages: Math.ceil(count / pageSize) });
});

//@desc     Get ingredient by ID
//@route    GET /api/ingredients/:id
//@access   Private/user

exports.getAgreement = asyncHandler(async (req, res) => {
    const agreement = await Agreement.findByPk(req.params.id);
    
    if (agreement) {
        res.json(agreement);
    } else {
        res.status(404);
        throw new Error("Agreement not found");
    }
});

//@desc     Update a ingredient
//@route    PUT /api/ingredients/:id
//@access   Private/user
exports.updateAgreement = asyncHandler(async (req, res) => {
    const { name, userId } = req.body;

    const agreement = await Agreement.findByPk(req.params.id);

    if (agreement) {
        agreement.name = name;
        agreement.userId = userId;

        const updatedAgreement = await agreement.save();
        res.json(updatedAgreement);
    } else {
        res.status(404);
        throw new Error("Agreement not found");
    }
});

//@desc     Delete a ingredient
//@route    DELETE /api/ingredients/:id
//@access   Private/user
exports.deleteAgreement = asyncHandler(async (req, res) => {
    const agreement = await Agreement.findByPk(req.params.id);

    if (agreement) {
        await agreement.destroy();
        res.json({ message: "Agreement removed" });
    } else {
        res.status(404);
        throw new Error("Agreement not found");
    }
});