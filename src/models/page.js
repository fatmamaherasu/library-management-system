const {query} =  require('express-validator')

const Sort = {
    date : 'createdAt',
}

const Search = {
    ISBN : 'ISBN',
    title : 'title',
    author : 'author',
    name : 'name',
    email: 'email'
}

const Order = {
    ASC : 'asc',
    DESC : 'desc',
}

class PageMeta {
    itemCount;
    pageCount;
    hasNextPage;
    hasPreviousPage;

    constructor(limit, page, count) {
        this.itemCount = count;
        this.pageCount = Math.ceil(this.itemCount / limit);
        this.hasNextPage = page < this.pageCount ? true : false;
        this.hasPreviousPage = page > 1 ? true : false;
    }
}

class Page {
    page;
    limit;
    search;
    sort;
    order;

    constructor(model, queries) {
        this.limit = queries.limit? queries.limit : 10;
        this.page = queries.page? queries.page : 1;
        this.search = null;
        this.skip = (this.page - 1) * this.limit;
        this.sort = null;
        this.order = queries.order? queries.order : Order.ASC;
        this.model = model;
        

        if (queries.sort) {
            this.sort = {
                [Sort[queries.sort]]: this.order,
            };
        }

        if (queries.search) {
            this.search = {
                [Search[queries.search]]: queries.search
            }
        }
    }

    select(fields) {
        this.selectedFields = fields;
        return this;
    }

    include(relation) {
        this.includeFields = relation;
        return this;
    }

    filter(filter) {
        this.where = filter;
        return this;
    }

    order(orderBy) {
        if (!this.sort) this.sort = orderBy;

        return this;
    }

    async exec() {
        const count = await this.model.count({ where: this.where });
        if (this.skip < 0) this.skip = 0;
    
        const result = await this.model.findMany({
            take: this.limit,
            skip: this.skip,
            where: this.where,
            include: this.includeFields ? this.includeFields : undefined,
            select: this.selectedFields ? this.selectedFields : undefined,
            orderBy: this.sort ? this.sort : undefined,
        });
    
        const pageMeta = new PageMeta(this.limit, this.page, count);
    
        return {
            meta: { ...pageMeta },
            result: result
        };
    }
}


const pageValidations = [
    query("page").isInt().optional(),
    query("limit").isInt().optional(),
    query("search").isString().optional(),
    query("sort").isString().optional(),
    query("order").isString().optional()
  ]


module.exports = {
    Page,
    pageValidations,
}